import { Form, useActionData, useNavigate, redirect, useLoaderData } from "react-router";
import { useState, useEffect } from "react";
import { Check, ArrowRight, User, Sparkles } from "lucide-react";

interface LoaderData {
  categories: Array<{ id: string; name: string; emoji?: string }>;
  authToken: string;
}

export async function loader({ request }: { request: Request }) {
  // Check if user is authenticated
  const cookies = request.headers.get("Cookie") || "";
  const tokenMatch = cookies.match(/auth_token=([^;]+)/);

  if (!tokenMatch) {
    return redirect("/auth/login");
  }

  // Fetch categories from backend
  try {
    const response = await fetch("https://admin.hararemetro.co.zw/api/categories");
    const data = await response.json();

    return {
      categories: data.categories || [],
      authToken: tokenMatch[1]
    };
  } catch (error) {
    console.error("Failed to load categories:", error);
    return {
      categories: [],
      authToken: tokenMatch[1]
    };
  }
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const username = formData.get("username") as string;
  const selectedCategories = formData.get("categories") as string;
  const cookies = request.headers.get("Cookie") || "";
  const tokenMatch = cookies.match(/auth_token=([^;]+)/);

  if (!tokenMatch) {
    return { error: "Not authenticated" };
  }

  const authToken = tokenMatch[1];

  try {
    // Step 1: Update username
    const usernameResponse = await fetch(
      "https://admin.hararemetro.co.zw/api/user/me/profile",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ username }),
      }
    );

    if (!usernameResponse.ok) {
      const error = await usernameResponse.json();
      return { error: error.error || "Failed to update username" };
    }

    // Step 2: Update category interests
    if (selectedCategories) {
      const categories = JSON.parse(selectedCategories);

      for (const categoryId of categories) {
        // Initialize interest score for selected categories
        await fetch(
          "https://admin.hararemetro.co.zw/api/user/me/category-interest",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              categoryId,
              initialScore: 10, // Starting interest score
            }),
          }
        );
      }
    }

    // Redirect to home after successful onboarding
    return redirect("/");
  } catch (error: any) {
    console.error("Onboarding error:", error);
    return { error: "Failed to complete onboarding. Please try again." };
  }
}

export default function Onboarding() {
  const loaderData = useLoaderData<LoaderData>();
  const { categories, authToken } = loaderData;
  const actionData = useActionData<{ error?: string }>();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [checkingUsername, setCheckingUsername] = useState(false);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Check username availability as user types
  const checkUsername = async (value: string) => {
    if (!value || value.length < 3) {
      setUsernameError("Username must be at least 3 characters");
      return false;
    }

    // Validate format
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(value)) {
      setUsernameError("Only letters, numbers, and underscores allowed");
      return false;
    }

    setCheckingUsername(true);
    try {
      const response = await fetch(
        `https://admin.hararemetro.co.zw/api/auth/check-username?username=${encodeURIComponent(value)}`
      );
      const data = await response.json();

      if (!data.available) {
        setUsernameError(data.error || "Username is already taken");
        return false;
      }

      setUsernameError("");
      return true;
    } catch (error) {
      setUsernameError("Error checking username");
      return false;
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);

    // Debounce the check
    if (value.length >= 3) {
      setTimeout(() => {
        if (value === username) {
          checkUsername(value);
        }
      }, 500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      // Validate username
      if (!username || username.length < 3) {
        setUsernameError("Username must be at least 3 characters");
        return;
      }

      // Final check before proceeding
      const isAvailable = await checkUsername(username);
      if (!isAvailable) {
        return;
      }

      setStep(2);
    } else {
      // Validate category selection
      if (selectedCategories.length < 3) {
        return;
      }
      setLoading(true);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex items-center justify-center px-4">
      {/* Zimbabwe Flag Strip */}
      <div className="fixed top-0 left-0 w-2 h-screen z-50 bg-gradient-to-b from-[hsl(var(--zw-green))] via-[hsl(var(--zw-yellow))] via-40% via-[hsl(var(--zw-red))] via-60% via-[hsl(var(--zw-black))] to-[hsl(var(--zw-white))]" />

      <div className="w-full max-w-2xl">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`w-12 h-1 rounded-full transition-colors ${step >= 1 ? 'bg-[hsl(var(--zw-green))]' : 'bg-gray-700'}`} />
          <div className={`w-12 h-1 rounded-full transition-colors ${step >= 2 ? 'bg-[hsl(var(--zw-green))]' : 'bg-gray-700'}`} />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[hsl(var(--zw-green))]/20 mb-4">
            <Sparkles className="w-8 h-8 text-[hsl(var(--zw-green))]" />
          </div>
          <h1 className="text-3xl font-serif font-bold mb-2">
            Welcome to Harare <span className="text-[hsl(var(--zw-green))]">Metro</span>
          </h1>
          <p className="text-gray-400">
            {step === 1 ? "Let's personalize your experience" : "Choose topics you care about"}
          </p>
        </div>

        {/* Error Message */}
        {actionData?.error && (
          <div className="mb-6 p-4 bg-[hsl(var(--zw-red))]/10 border border-[hsl(var(--zw-red))]/20 rounded-xl text-[hsl(var(--zw-red))] text-center">
            {actionData.error}
          </div>
        )}

        <Form method="post" onSubmit={handleSubmit}>
          {/* Step 1: Username */}
          {step === 1 && (
            <div className="bg-gray-900 rounded-2xl p-8 shadow-2xl">
              <div className="mb-6 text-center">
                <User className="w-12 h-12 text-[hsl(var(--zw-green))] mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Choose Your Username</h2>
                <p className="text-sm text-gray-400">
                  This is how others will see you on Harare Metro
                </p>
              </div>

              <div className="mb-6">
                <label htmlFor="username" className="block text-sm font-semibold mb-2">
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={username}
                    onChange={handleUsernameChange}
                    required
                    minLength={3}
                    maxLength={30}
                    pattern="^[a-zA-Z0-9_]+$"
                    placeholder="johndoe"
                    className={`w-full px-4 py-3 bg-black border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                      usernameError
                        ? 'border-[hsl(var(--zw-red))] focus:ring-[hsl(var(--zw-red))]/20'
                        : username.length >= 3 && !checkingUsername
                        ? 'border-[hsl(var(--zw-green))] focus:ring-[hsl(var(--zw-green))]/20'
                        : 'border-gray-700 focus:border-[hsl(var(--zw-green))] focus:ring-[hsl(var(--zw-green))]/20'
                    }`}
                  />
                  {checkingUsername && (
                    <div className="absolute right-3 top-3">
                      <div className="w-5 h-5 border-2 border-[hsl(var(--zw-green))] border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {!checkingUsername && username.length >= 3 && !usernameError && (
                    <div className="absolute right-3 top-3">
                      <Check className="w-5 h-5 text-[hsl(var(--zw-green))]" />
                    </div>
                  )}
                </div>
                {usernameError ? (
                  <p className="text-xs text-[hsl(var(--zw-red))] mt-2">
                    {usernameError}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-2">
                    Letters, numbers, and underscores only. Minimum 3 characters.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={!username || username.length < 3 || !!usernameError || checkingUsername}
                className="w-full py-3 bg-[hsl(var(--zw-green))] hover:bg-[hsl(var(--zw-green))]/80 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {checkingUsername ? 'Checking...' : 'Continue'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Step 2: Category Interests */}
          {step === 2 && (
            <div className="bg-gray-900 rounded-2xl p-8 shadow-2xl">
              <div className="mb-6 text-center">
                <h2 className="text-xl font-semibold mb-2">Select Your Interests</h2>
                <p className="text-sm text-gray-400">
                  Choose at least 3 topics you'd like to follow (you can change these later)
                </p>
              </div>

              {/* Category Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6 max-h-96 overflow-y-auto">
                {categories.map((category: any) => {
                  const isSelected = selectedCategories.includes(category.id);
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => toggleCategory(category.id)}
                      className={`
                        relative p-4 rounded-xl border-2 transition-all text-left
                        ${isSelected
                          ? 'border-[hsl(var(--zw-green))] bg-[hsl(var(--zw-green))]/10'
                          : 'border-gray-700 hover:border-gray-600 bg-black'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-2xl mb-2">{category.emoji || '📰'}</div>
                          <div className="font-semibold text-sm">{category.name}</div>
                        </div>
                        {isSelected && (
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 rounded-full bg-[hsl(var(--zw-green))] flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selection Counter */}
              <div className="text-center mb-6">
                <p className="text-sm text-gray-400">
                  {selectedCategories.length === 0 && "Select at least 3 topics"}
                  {selectedCategories.length > 0 && selectedCategories.length < 3 && `${selectedCategories.length} selected • ${3 - selectedCategories.length} more needed`}
                  {selectedCategories.length >= 3 && `${selectedCategories.length} topics selected`}
                </p>
              </div>

              {/* Hidden input for categories */}
              <input
                type="hidden"
                name="categories"
                value={JSON.stringify(selectedCategories)}
              />

              {/* Navigation Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={selectedCategories.length < 3 || loading}
                  className="flex-1 py-3 bg-[hsl(var(--zw-green))] hover:bg-[hsl(var(--zw-green))]/80 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Get Started
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </Form>

        {/* Skip Option */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/")}
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
