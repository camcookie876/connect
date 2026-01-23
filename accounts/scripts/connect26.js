// ===== Supabase client setup =====
const SUPABASE_URL = "https://tznznnovxygelreoddxh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6bnpubm92eHlnZWxyZW9kZHhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3ODE4NDIsImV4cCI6MjA4NDM1Nzg0Mn0.QVL5EZqaeop1KunP6Fa-eS6dx7AlC52ocUltK1DmP4c";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== Helpers =====
function $(sel) {
    return document.querySelector(sel);
}

function showError(msg) {
    const el = $(".cc-error");
    if (el) {
        el.textContent = msg;
        el.style.display = "block";
    } else {
        alert(msg);
    }
}

function showMessage(msg) {
    const el = $(".cc-message");
    if (el) {
        el.textContent = msg;
        el.style.display = "block";
    } else {
        alert(msg);
    }
}

function redirectToHome() {
    // Change this to wherever you want users to land after login
    window.location.href = "https://camcookie876.github.io/connect/";
}

// ===== Profile compatibility layer =====
// Works with your existing profiles table and old accounts
async function ensureProfileExists(userId, email) {
    const { data: existing, error: selectError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    if (existing) return;

    // Generate a default username if none exists
    const baseName = email ? email.split("@")[0] : "user";
    const username = baseName + Math.floor(Math.random() * 99999);

    const { error: insertError } = await supabase.from("profiles").insert({
        id: userId,
        username: username,
        bio: ""
    });

    if (insertError) {
        console.error("Failed to create profile:", insertError);
    }
}

// ===== Email/password signup =====
async function handleSignupSubmit(e) {
    e.preventDefault();
    const email = $("#email").value.trim();
    const password = $("#password").value.trim();
    const agree = $("#agree").checked;

    if (!agree) {
        showError("You must agree to the terms and conditions.");
        return;
    }

    if (!email || !password) {
        showError("Please enter an email and password.");
        return;
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password
    });

    if (error) {
        showError(error.message);
        return;
    }

    showMessage("Check your email to confirm your account.");
}

// ===== Email/password login =====
async function handleLoginSubmit(e) {
    e.preventDefault();
    const email = $("#email").value.trim();
    const password = $("#password").value.trim();

    if (!email || !password) {
        showError("Please enter an email and password.");
        return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        showError(error.message);
        return;
    }

    const user = data.user;
    if (!user) {
        showError("Login failed. No user returned.");
        return;
    }

    await ensureProfileExists(user.id, user.email);
    redirectToHome();
}

// ===== GitHub OAuth login =====
function handleGitHubLogin() {
    supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
            redirectTo: "https://camcookie876.github.io/connect/accounts/oath/"
        }
    });
}

// ===== OAuth callback handler (on /oath/) =====
async function handleOAuthCallback() {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
        showError("OAuth error: " + error.message);
        return;
    }

    const session = data.session;
    if (!session || !session.user) {
        showError("OAuth login failed. No session found.");
        return;
    }

    const user = session.user;
    const email = user.email || (user.user_metadata && user.user_metadata.email) || null;

    await ensureProfileExists(user.id, email);
    redirectToHome();
}

// ===== Page init =====
document.addEventListener("DOMContentLoaded", () => {
    const page = document.body.dataset.page;

    if (page === "login") {
        const form = $("#login-form");
        if (form) form.addEventListener("submit", handleLoginSubmit);

        const ghBtn = $("#github-login");
        if (ghBtn) ghBtn.addEventListener("click", handleGitHubLogin);
    }

    if (page === "signup") {
        const form = $("#signup-form");
        if (form) form.addEventListener("submit", handleSignupSubmit);

        const ghBtn = $("#github-login");
        if (ghBtn) ghBtn.addEventListener("click", handleGitHubLogin);
    }

    if (page === "oath") {
        handleOAuthCallback();
    }
});