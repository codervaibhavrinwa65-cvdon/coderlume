import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, addDoc, setDoc,
  updateDoc, deleteDoc, query, where, orderBy, limit, serverTimestamp,
  Timestamp, writeBatch, onSnapshot
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// Public Firebase web configuration for the CODERLUME website.
const firebaseConfig = {
  apiKey: "AIzaSyAElXjr0wHQRRngfzgTlqub6HM6V_Cy4FE",
  authDomain: "coderlume.firebaseapp.com",
  projectId: "coderlume",
  storageBucket: "coderlume.firebasestorage.app",
  messagingSenderId: "493035320543",
  appId: "1:493035320543:web:df23a2ce5dea0962c9a56a"
};

const CLOUD_NAME = "jsx5prhc";
const UPLOAD_PRESET = "coderlume_uploads";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const root = document.getElementById("app");
const modalRoot = document.getElementById("modalRoot");
const state = {
  user: null, profile: null, users: [], posts: [], stories: [],
  view: "home", profileUid: null, messageTarget: null,
  activeConversationId: null, activeConversationUser: null,
  messageUnsubscribe: null, toastTimer: null, authMode: "login", pendingDisplayName: "", searchTerm: ""
};

const icons = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1z"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16.2 7.8-2.5 5.9-5.9 2.5 2.5-5.9z"/>',
  message: '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"/>',
  user: '<path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8z"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  logout: '<path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 2z"/>',
  close: '<path d="m18 6-12 12M6 6l12 12"/>',
  send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>'
};
function icon(name, cls = "") { return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.home}</svg>`; }
function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}
function initials(name = "Member") { return name.trim().split(/\s+/).slice(0, 2).map(x => x[0] || "").join("").toUpperCase() || "M"; }
function avatarHTML(user, size = "md") {
  const name = user?.displayName || "CODERLUME member";
  return user?.photoURL
    ? `<img class="avatar ${size}" src="${escapeHTML(user.photoURL)}" alt="${escapeHTML(name)}" loading="lazy">`
    : `<span class="avatar avatar-fallback ${size}" aria-label="${escapeHTML(name)}">${escapeHTML(initials(name))}</span>`;
}
function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast visible ${type}`;
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.className = "toast", 3200);
}
function formatDate(value) {
  const date = value?.toDate ? value.toDate() : value instanceof Date ? value : null;
  if (!date) return "Just now";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}
function timeLeft(value) {
  const date = value?.toDate ? value.toDate() : new Date(value);
  const hours = Math.max(0, Math.ceil((date.getTime() - Date.now()) / 3600000));
  return `${hours}h left`;
}
function safeImageURL(url) {
  try { const parsed = new URL(url); return parsed.protocol === "https:" ? parsed.href : ""; }
  catch { return ""; }
}
async function uploadImage(file, folder) {
  if (!file) return "";
  if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) throw new Error("Choose a JPG, PNG, WEBP or GIF image.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Image must be 8 MB or smaller.");
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", UPLOAD_PRESET);
  data.append("folder", `coderlume/${folder}`);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: data });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error?.message || "Image upload failed. Check your Cloudinary unsigned preset.");
  const url = safeImageURL(result.secure_url);
  if (!url) throw new Error("The image service returned an invalid image URL.");
  return url;
}

function renderShell() {
  root.innerHTML = `
    <section id="authScreen" class="auth-screen">
      <div class="auth-visual">
        <div class="auth-visual-glow"></div>
        <div class="brand brand-large"><span class="brand-emblem">C<span>✦</span></span><span>CODER<span class="brand-light">LUME</span></span></div>
        <div class="auth-art-copy"><span class="eyebrow">YOUR WORLD. YOUR COMMUNITY.</span><h1>Make space<br>for <em>what matters.</em></h1><p>Meet people, share your moments and find your corner of the internet.</p></div>
        <div class="auth-orbit orbit-one"></div><div class="auth-orbit orbit-two"></div>
        <div class="auth-visual-foot"><span>CONNECT</span><i></i><span>CREATE</span><i></i><span>SHARE</span></div>
      </div>
      <div class="auth-side">
        <div class="auth-card">
          <div class="mobile-brand brand"><span class="brand-emblem">C<span>✦</span></span><span>CODER<span class="brand-light">LUME</span></span></div>
          <div class="auth-heading"><span class="eyebrow" id="authEyebrow">WELCOME BACK</span><h2 id="authTitle">Sign in to your world</h2><p id="authSubtitle">Your community is just a moment away.</p></div>
          <form id="authForm" class="form-stack">
            <label id="nameField" class="field hidden">Display name<input id="authName" maxlength="32" autocomplete="name" placeholder="Your name"></label>
            <label class="field">Email address<input id="authEmail" type="email" autocomplete="email" required placeholder="you@example.com"></label>
            <label class="field">Password<input id="authPassword" type="password" minlength="6" autocomplete="current-password" required placeholder="At least 6 characters"></label>
            <button class="btn btn-primary btn-full" id="authSubmit" type="submit">Sign in <span>→</span></button>
            <button class="text-button" type="button" id="resetPassword">Forgot password?</button>
          </form>
          <p class="auth-switch" id="authSwitch">New to CODERLUME? <button type="button" id="switchAuth">Create an account</button></p>
          <p class="auth-legal">By continuing, you agree to treat people with respect and keep your account secure.</p>
          <p id="authError" class="form-error" role="alert"></p>
        </div>
      </div>
    </section>

    <section id="appScreen" class="app-screen hidden">
      <aside class="side-rail">
        <button class="brand brand-button" type="button" data-view="home" aria-label="CODERLUME home"><span class="brand-emblem">C<span>✦</span></span><span class="brand-word">CODER<span class="brand-light">LUME</span></span></button>
        <nav class="main-nav" aria-label="Main navigation">
          <button class="nav-item active" data-view="home">${icon("home")}<span>Home</span></button>
          <button class="nav-item" data-view="explore">${icon("compass")}<span>Explore</span></button>
          <button class="nav-item" data-view="stories">${icon("image")}<span>Stories</span></button>
          <button class="nav-item" data-view="messages">${icon("message")}<span>Messages</span><b id="messageBadge" class="nav-dot hidden"></b></button>
          <button class="nav-item" data-view="profile">${icon("user")}<span>My profile</span></button>
        </nav>
        <div class="rail-bottom"><button class="nav-item" id="signOutBtn">${icon("logout")}<span>Log out</span></button><div class="rail-user" id="railUser"></div></div>
      </aside>

      <header class="mobile-topbar"><button class="brand brand-button" data-view="home"><span class="brand-emblem">C<span>✦</span></span><span class="brand-word">CODER<span class="brand-light">LUME</span></span></button><button class="icon-button" data-view="profile" aria-label="My profile" id="mobileAvatar"></button></header>

      <main class="main-area">
        <div class="mobile-search" id="mobileSearch">${icon("search")}<input id="globalSearchMobile" placeholder="Search people and posts"></div>
        <div id="viewRoot" class="view-root"></div>
      </main>

      <aside class="right-rail" id="rightRail">
        <div class="rail-search">${icon("search")}<input id="globalSearch" placeholder="Search CODERLUME"><kbd>⌘ K</kbd></div>
        <section class="right-card profile-mini" id="miniProfile"></section>
        <section class="right-card trend-card"><div class="section-head"><div><span class="eyebrow">THE COMMUNITY</span><h3>Find your people</h3></div>${icon("users")}</div><p>Explore creators, discover new voices and follow the people who inspire you.</p><button class="btn btn-soft btn-full" data-view="explore">Explore community ${icon("compass")}</button></section>
        <section class="right-card guidelines"><span class="eyebrow">A BETTER PLACE, TOGETHER</span><h3>Keep it kind.</h3><p>Be respectful, protect your privacy and only share content you have permission to post.</p></section>
        <footer class="site-footer">CODERLUME © 2026 <span>Connect. Create. Share.</span></footer>
      </aside>
      <nav class="mobile-nav" aria-label="Mobile navigation"><button class="active" data-view="home">${icon("home")}<span>Home</span></button><button data-view="explore">${icon("compass")}<span>Explore</span></button><button data-view="stories">${icon("image")}<span>Stories</span></button><button data-view="messages">${icon("message")}<span>Messages</span></button><button data-view="profile">${icon("user")}<span>Profile</span></button></nav>
    </section>`;
  bindAuthUI();
}

function bindAuthUI() {
  $("switchAuth").onclick = () => setAuthMode(state.authMode === "login" ? "signup" : "login");
  $("authForm").onsubmit = handleAuth;
  $("resetPassword").onclick = async () => {
    const email = $("authEmail").value.trim();
    if (!email) return showAuthError("Enter your email address first.");
    try { await sendPasswordResetEmail(auth, email); showAuthError("Password reset email sent. Check your inbox.", true); }
    catch (e) { showAuthError(authErrorText(e)); }
  };
  $("signOutBtn").onclick = () => signOut(auth).catch(e => showToast(e.message, "error"));
  root.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.view)));
  $("globalSearch").addEventListener("keydown", e => { if (e.key === "Enter") { state.searchTerm = e.target.value.trim(); navigate("explore"); } });
  $("globalSearchMobile").addEventListener("keydown", e => { if (e.key === "Enter") { state.searchTerm = e.target.value.trim(); navigate("explore"); } });
}
function setAuthMode(mode) {
  state.authMode = mode;
  const signup = mode === "signup";
  $("nameField").classList.toggle("hidden", !signup);
  $("authEyebrow").textContent = signup ? "JOIN THE COMMUNITY" : "WELCOME BACK";
  $("authTitle").textContent = signup ? "Create your account" : "Sign in to your world";
  $("authSubtitle").textContent = signup ? "A fresh space to connect, create and share." : "Your community is just a moment away.";
  $("authSubmit").innerHTML = signup ? 'Create account <span>→</span>' : 'Sign in <span>→</span>';
  $("authSwitch").innerHTML = signup ? 'Already a member? <button type="button" id="switchAuth">Sign in</button>' : 'New to CODERLUME? <button type="button" id="switchAuth">Create an account</button>';
  $("switchAuth").onclick = () => setAuthMode(signup ? "login" : "signup");
  $("resetPassword").classList.toggle("hidden", signup);
  $("authPassword").autocomplete = signup ? "new-password" : "current-password";
  showAuthError("");
}
function showAuthError(message, success = false) { $("authError").textContent = message; $("authError").classList.toggle("success-text", success); }
function authErrorText(error) {
  const map = { "auth/email-already-in-use": "An account already exists with this email.", "auth/invalid-email": "Enter a valid email address.", "auth/weak-password": "Use a password with at least 6 characters.", "auth/invalid-credential": "Email or password is incorrect.", "auth/user-not-found": "No account was found for this email.", "auth/too-many-requests": "Too many attempts. Please try again later." };
  return map[error.code] || error.message || "Something went wrong. Please try again.";
}
async function handleAuth(event) {
  event.preventDefault();
  const email = $("authEmail").value.trim();
  const password = $("authPassword").value;
  const button = $("authSubmit");
  button.disabled = true;
  showAuthError("");
  try {
    if (state.authMode === "signup") {
      const displayName = $("authName").value.trim();
      if (displayName.length < 2) throw new Error("Please enter a display name with at least 2 characters.");
      state.pendingDisplayName = displayName;
      await createUserWithEmailAndPassword(auth, email, password);
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
  } catch (e) { state.pendingDisplayName = ""; showAuthError(authErrorText(e)); }
  finally { button.disabled = false; }
}
function $(id) { return document.getElementById(id); }

async function createProfile(user, displayName) {
  const ref = doc(db, "users", user.uid);
  const existing = await getDoc(ref);
  if (!existing.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      displayName: displayName || user.displayName || (user.email || "member").split("@")[0],
      username: `member${user.uid.slice(-6).toLowerCase()}`,
      bio: "New to CODERLUME. Happy to connect!",
      photoURL: "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } else if (displayName) {
    await updateDoc(ref, { displayName, updatedAt: serverTimestamp() });
  }
}
async function loadMyProfile() {
  const ref = doc(db, "users", state.user.uid);
  let snap = await getDoc(ref);
  if (!snap.exists()) {
    await createProfile(state.user, state.pendingDisplayName || state.user.displayName || (state.user.email || "member").split("@")[0]);
    state.pendingDisplayName = "";
    snap = await getDoc(ref);
  }
  state.profile = { uid: snap.id, ...snap.data() };
  renderUserChrome();
}
function renderUserChrome() {
  const p = state.profile || {};
  $("railUser").innerHTML = `${avatarHTML(p, "sm")}<span><strong>${escapeHTML(p.displayName || "Member")}</strong><small>@${escapeHTML(p.username || "member")}</small></span>`;
  $("mobileAvatar").innerHTML = avatarHTML(p, "sm");
  $("miniProfile").innerHTML = `<div class="mini-profile-top">${avatarHTML(p, "lg")}<div><strong>${escapeHTML(p.displayName || "Member")}</strong><span>@${escapeHTML(p.username || "member")}</span></div></div><p>${escapeHTML(p.bio || "Make yourself at home.")}</p><button class="text-link" data-view="profile">View your profile →</button>`;
  $("miniProfile").querySelector("[data-view]").onclick = () => navigate("profile");
}

async function navigate(view) {
  if (!state.user) return;
  state.view = view;
  root.querySelectorAll(".nav-item[data-view], .mobile-nav button[data-view]").forEach(button => button.classList.toggle("active", button.dataset.view === view));
  if (state.messageUnsubscribe && view !== "messages") { state.messageUnsubscribe(); state.messageUnsubscribe = null; }
  if (view === "home") await renderHome();
  else if (view === "explore") await renderExplore();
  else if (view === "stories") await renderStoriesPage();
  else if (view === "messages") await renderMessages();
  else if (view === "profile") await renderProfile(state.profile?.uid || state.user.uid);
}
function pageHeader(eyebrow, title, subtitle = "") {
  return `<div class="page-heading"><div><span class="eyebrow">${escapeHTML(eyebrow)}</span><h1>${escapeHTML(title)}</h1>${subtitle ? `<p>${escapeHTML(subtitle)}</p>` : ""}</div></div>`;
}

async function fetchPosts(max = 40) {
  const snap = await getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(max)));
  state.posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return state.posts;
}
async function fetchUsers() {
  const snap = await getDocs(query(collection(db, "users"), limit(120)));
  state.users = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
  return state.users;
}
async function fetchStories() {
  const now = Timestamp.now();
  const snap = await getDocs(query(collection(db, "stories"), where("expiresAt", ">", now), orderBy("expiresAt", "asc"), limit(60)));
  state.stories = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return state.stories;
}
function loadingBlock(text = "Loading…") { return `<div class="loading-block"><span class="spinner"></span>${escapeHTML(text)}</div>`; }
function emptyBlock(title, copy, button = "") { return `<div class="empty-state"><div class="empty-orb">✦</div><h3>${escapeHTML(title)}</h3><p>${escapeHTML(copy)}</p>${button}</div>`; }

async function renderHome() {
  const view = $("viewRoot");
  view.innerHTML = `${pageHeader("YOUR SPACE", "Your feed", "Good things happen when people share.")}<div id="storiesStrip"></div><section class="composer-card" id="composerCard"><div class="composer-top">${avatarHTML(state.profile, "md")}<button class="composer-trigger" id="openComposer">Share something with your community…</button></div><div class="composer-actions"><button id="addPhotoShortcut">${icon("image")} Photo</button><button data-view="stories">${icon("plus")} Add a story</button><span class="composer-spacer"></span><button class="btn btn-primary btn-small" id="openComposer2">Create post</button></div></section><div class="feed-title"><h2>Latest from the community</h2><span>Fresh perspectives, shared here</span></div><div id="feedList">${loadingBlock("Loading your community feed…")}</div>`;
  bindLocalNav(view);
  $("openComposer").onclick = () => openComposerModal();
  $("openComposer2").onclick = () => openComposerModal();
  $("addPhotoShortcut").onclick = () => openComposerModal(true);
  try {
    const [stories, posts] = await Promise.all([fetchStories(), fetchPosts()]);
    renderStoryStrip(stories, $("storiesStrip"));
    const feed = $("feedList");
    feed.replaceChildren();
    if (!posts.length) feed.innerHTML = emptyBlock("Your feed is ready", "Be the first to share a thought, photo or moment with the community.", '<button class="btn btn-primary" id="firstPost">Create your first post</button>');
    else for (const post of posts) feed.append(await buildPostCard(post));
    const firstPost = $("firstPost"); if (firstPost) firstPost.onclick = () => openComposerModal();
  } catch (e) { $("feedList").innerHTML = emptyBlock("Could not load the feed", e.message, '<button class="btn btn-soft" id="retryFeed">Try again</button>'); $("retryFeed").onclick = renderHome; }
}
function bindLocalNav(container) { container.querySelectorAll("[data-view]").forEach(b => b.onclick = () => navigate(b.dataset.view)); }

async function buildPostCard(post) {
  const card = document.createElement("article");
  card.className = "post-card";
  const author = { displayName: post.displayName || "CODERLUME member", username: post.username || "member", photoURL: post.photoURL || "" };
  const header = document.createElement("div"); header.className = "post-head";
  const authorButton = document.createElement("button"); authorButton.className = "post-author-button"; authorButton.innerHTML = `${avatarHTML(author, "md")}<span><strong>${escapeHTML(author.displayName)}</strong><small>@${escapeHTML(author.username)} · ${escapeHTML(formatDate(post.createdAt))}</small></span>`;
  authorButton.onclick = () => renderProfile(post.uid);
  header.append(authorButton);
  if (post.uid === state.user.uid) {
    const menu = document.createElement("button"); menu.className = "icon-button post-menu"; menu.textContent = "•••"; menu.setAttribute("aria-label", "Post options");
    menu.onclick = () => { if (confirm("Delete this post? This cannot be undone.")) deletePost(post.id); };
    header.append(menu);
  }
  card.append(header);
  if (post.caption) { const text = document.createElement("p"); text.className = "post-caption"; text.textContent = post.caption; card.append(text); }
  if (post.imageUrl) { const url = safeImageURL(post.imageUrl); if (url) { const media = document.createElement("img"); media.className = "post-media"; media.src = url; media.alt = "Post shared with the CODERLUME community"; media.loading = "lazy"; media.onclick = () => openImageViewer(url, author.displayName); card.append(media); } }
  const stats = document.createElement("div"); stats.className = "post-stats"; stats.innerHTML = `<span class="like-count">Loading likes…</span><span class="comment-count">Comments</span>`; card.append(stats);
  const actions = document.createElement("div"); actions.className = "post-actions";
  const likeBtn = document.createElement("button"); likeBtn.className = "post-action like-action"; likeBtn.innerHTML = `${icon("heart")}<span>Like</span>`;
  const commentBtn = document.createElement("button"); commentBtn.className = "post-action"; commentBtn.innerHTML = `${icon("message")}<span>Comment</span>`;
  actions.append(likeBtn, commentBtn); card.append(actions);
  const commentArea = document.createElement("div"); commentArea.className = "comment-area hidden";
  const commentList = document.createElement("div"); commentList.className = "comment-list";
  const commentForm = document.createElement("form"); commentForm.className = "comment-form";
  commentForm.innerHTML = `<input maxlength="500" placeholder="Write a thoughtful comment…" aria-label="Write a comment" required><button class="send-button" aria-label="Send comment">${icon("send")}</button>`;
  commentArea.append(commentList, commentForm); card.append(commentArea);
  let liked = false;
  const likeRef = doc(db, "posts", post.id, "likes", state.user.uid);
  try {
    const [likeSnap, likeDocs, commentDocs] = await Promise.all([
      getDoc(likeRef), getDocs(collection(db, "posts", post.id, "likes")),
      getDocs(query(collection(db, "posts", post.id, "comments"), orderBy("createdAt", "asc"), limit(5)))
    ]);
    liked = likeSnap.exists();
    likeBtn.classList.toggle("liked", liked);
    stats.querySelector(".like-count").textContent = `${likeDocs.size} ${likeDocs.size === 1 ? "like" : "likes"}`;
    stats.querySelector(".comment-count").textContent = `${commentDocs.size} ${commentDocs.size === 1 ? "comment" : "comments"}`;
    commentDocs.forEach(d => commentList.append(makeComment(d.data())));
  } catch (e) { stats.querySelector(".like-count").textContent = "Likes unavailable"; }
  likeBtn.onclick = async () => {
    likeBtn.disabled = true;
    try {
      if (liked) await deleteDoc(likeRef);
      else await setDoc(likeRef, { uid: state.user.uid, createdAt: serverTimestamp() });
      liked = !liked; likeBtn.classList.toggle("liked", liked);
      const n = await getDocs(collection(db, "posts", post.id, "likes"));
      stats.querySelector(".like-count").textContent = `${n.size} ${n.size === 1 ? "like" : "likes"}`;
    } catch (e) { showToast(`Could not update like: ${e.message}`, "error"); }
    finally { likeBtn.disabled = false; }
  };
  commentBtn.onclick = () => { commentArea.classList.toggle("hidden"); if (!commentArea.classList.contains("hidden")) commentForm.querySelector("input").focus(); };
  commentForm.onsubmit = async e => {
    e.preventDefault(); const input = commentForm.querySelector("input"); const value = input.value.trim(); if (!value) return;
    const send = commentForm.querySelector("button"); send.disabled = true;
    try {
      await addDoc(collection(db, "posts", post.id, "comments"), { uid: state.user.uid, displayName: state.profile.displayName, username: state.profile.username, text: value, createdAt: serverTimestamp() });
      commentList.append(makeComment({ displayName: state.profile.displayName, username: state.profile.username, text: value }));
      input.value = "";
      const n = await getDocs(collection(db, "posts", post.id, "comments")); stats.querySelector(".comment-count").textContent = `${n.size} ${n.size === 1 ? "comment" : "comments"}`;
    } catch (e2) { showToast(e2.message, "error"); }
    finally { send.disabled = false; }
  };
  return card;
}
function makeComment(data) {
  const item = document.createElement("p"); item.className = "comment-item";
  const strong = document.createElement("strong"); strong.textContent = data.displayName || "Member";
  const text = document.createElement("span"); text.textContent = ` ${data.text || ""}`;
  item.append(strong, text); return item;
}
async function deletePost(postId) {
  try { await deleteDoc(doc(db, "posts", postId)); showToast("Post deleted.", "success"); if (state.view === "home") renderHome(); else if (state.view === "profile") renderProfile(state.profileUid); }
  catch (e) { showToast(`Could not delete post: ${e.message}`, "error"); }
}

function renderStoryStrip(stories, target) {
  if (!target) return;
  target.innerHTML = `<section class="stories-card"><div class="stories-heading"><div><span class="eyebrow">MOMENTS THAT LAST 24 HOURS</span><h2>Stories</h2></div><button class="text-link" id="allStories">See all →</button></div><div class="story-row" id="storyRow"></div></section>`;
  const row = target.querySelector("#storyRow");
  const mine = stories.filter(s => s.uid === state.user.uid);
  const add = document.createElement("button"); add.className = "story-tile add-story";
  add.innerHTML = `<span class="story-ring">${avatarHTML(state.profile, "story-avatar")}<b>+</b></span><span>Your story</span>`;
  add.onclick = () => openStoryCreator(); row.append(add);
  const unique = new Map(); stories.forEach(s => { if (!unique.has(s.uid)) unique.set(s.uid, s); });
  [...unique.values()].filter(s => s.uid !== state.user.uid).slice(0, 8).forEach(story => {
    const u = state.users.find(x => x.uid === story.uid) || { displayName: story.displayName, photoURL: story.photoURL };
    const tile = document.createElement("button"); tile.className = "story-tile";
    tile.innerHTML = `<span class="story-ring">${avatarHTML(u, "story-avatar")}</span><span>${escapeHTML(u.displayName || "Member")}</span>`;
    tile.onclick = () => openStoryViewer(stories.filter(s => s.uid === story.uid), 0); row.append(tile);
  });
  target.querySelector("#allStories").onclick = () => navigate("stories");
}
async function createStory(file) {
  const imageUrl = await uploadImage(file, "stories");
  await addDoc(collection(db, "stories"), {
    uid: state.user.uid, displayName: state.profile.displayName,
    username: state.profile.username, photoURL: state.profile.photoURL || "",
    imageUrl, createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000))
  });
  showToast("Your story is live for 24 hours.", "success");
  if (state.view === "stories") renderStoriesPage(); else renderHome();
}
function openStoryCreator() {
  modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal-card small-modal"><button class="modal-close" data-close>${icon("close")}</button><span class="eyebrow">SHARE A MOMENT</span><h2>Add to your story</h2><p>Your photo will be visible to signed-in CODERLUME members for 24 hours.</p><label class="upload-drop">${icon("image")}<strong>Choose a photo</strong><span>JPG, PNG, WEBP or GIF · up to 8 MB<input id="storyFile" type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden></span></label><button class="btn btn-primary btn-full" id="publishStory" disabled>Share story</button><p id="storyError" class="form-error"></p></section></div>`;
  bindModalClose();
  const input = $("storyFile"); input.onchange = () => { $("publishStory").disabled = !input.files.length; };
  $("publishStory").onclick = async () => { const b = $("publishStory"); b.disabled = true; b.textContent = "Uploading…"; try { await createStory(input.files[0]); closeModal(); } catch (e) { $("storyError").textContent = e.message; b.disabled = false; b.textContent = "Share story"; } };
}
function openStoryViewer(group, index = 0) {
  const story = group[index]; if (!story) return;
  modalRoot.innerHTML = `<div class="story-viewer-backdrop"><section class="story-viewer"><button class="modal-close light-close" data-close>${icon("close")}</button><div class="story-progress"><span></span></div><div class="story-viewer-user">${avatarHTML({ displayName: story.displayName, photoURL: story.photoURL }, "sm")}<strong>${escapeHTML(story.displayName || "Member")}</strong><small>${escapeHTML(timeLeft(story.expiresAt))}</small></div><img src="${escapeHTML(safeImageURL(story.imageUrl))}" alt="Story shared by ${escapeHTML(story.displayName || "member")}"><div class="story-viewer-controls">${index > 0 ? '<button id="storyPrev">‹</button>' : '<span></span>'}${index < group.length - 1 ? '<button id="storyNext">›</button>' : '<span></span>'}</div>${story.uid === state.user.uid ? '<button id="deleteStory" class="story-delete">Delete story</button>' : ""}</section></div>`;
  bindModalClose();
  if ($("storyPrev")) $("storyPrev").onclick = () => openStoryViewer(group, index - 1);
  if ($("storyNext")) $("storyNext").onclick = () => openStoryViewer(group, index + 1);
  if ($("deleteStory")) $("deleteStory").onclick = async () => { try { await deleteDoc(doc(db, "stories", story.id)); showToast("Story deleted.", "success"); closeModal(); if (state.view === "stories") renderStoriesPage(); else renderHome(); } catch (e) { showToast(e.message, "error"); } };
}
async function renderStoriesPage() {
  const view = $("viewRoot"); view.innerHTML = `${pageHeader("SHARE A MOMENT", "Stories", "Little snapshots from your community. Stories disappear after 24 hours.")}<div class="story-page-actions"><button class="btn btn-primary" id="newStory">${icon("plus")} Create a story</button></div><div id="storyGrid">${loadingBlock("Finding fresh stories…")}</div>`;
  $("newStory").onclick = openStoryCreator;
  try {
    const stories = await fetchStories(); await fetchUsers();
    const grid = $("storyGrid"); grid.replaceChildren();
    if (!stories.length) grid.innerHTML = emptyBlock("No stories yet", "Share the first moment with your community.", '<button class="btn btn-primary" id="emptyStory">Create a story</button>');
    else {
      const byUser = new Map(); stories.forEach(s => { if (!byUser.has(s.uid)) byUser.set(s.uid, []); byUser.get(s.uid).push(s); });
      grid.className = "story-grid";
      for (const [uid, items] of byUser) {
        const user = state.users.find(u => u.uid === uid) || items[0];
        const tile = document.createElement("button"); tile.className = "story-grid-card";
        tile.innerHTML = `<img src="${escapeHTML(safeImageURL(items[0].imageUrl))}" alt="Story preview"><span class="story-grid-shade"></span><span class="story-grid-person">${avatarHTML(user, "sm")}<span><strong>${escapeHTML(user.displayName || "Member")}</strong><small>${escapeHTML(timeLeft(items[0].expiresAt))}</small></span></span>`;
        tile.onclick = () => openStoryViewer(items, 0); grid.append(tile);
      }
    }
    const empty = $("emptyStory"); if (empty) empty.onclick = openStoryCreator;
  } catch (e) { $("storyGrid").innerHTML = emptyBlock("Stories are unavailable", e.message); }
}

function openComposerModal(photoFirst = false) {
  modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal-card composer-modal"><button class="modal-close" data-close>${icon("close")}</button><span class="eyebrow">CREATE SOMETHING</span><h2>Share with your community</h2><div class="composer-author">${avatarHTML(state.profile, "md")}<span><strong>${escapeHTML(state.profile.displayName)}</strong><small>Posting to CODERLUME</small></span></div><textarea id="newCaption" maxlength="2200" placeholder="What would you like to share?"></textarea><label class="upload-drop compact-upload">${icon("image")}<strong>Add a photo</strong><span>JPG, PNG, WEBP or GIF · up to 8 MB<input id="postFile" type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden></span></label><div id="postPreview" class="post-preview"></div><p id="postError" class="form-error"></p><button class="btn btn-primary btn-full" id="publishPost">Publish post</button></section></div>`;
  bindModalClose();
  const fileInput = $("postFile"); fileInput.onchange = () => {
    const file = fileInput.files[0]; if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) { $("postError").textContent = "Image must be 8 MB or smaller."; fileInput.value = ""; return; }
    const reader = new FileReader(); reader.onload = () => { $("postPreview").innerHTML = `<img src="${reader.result}" alt="Selected post preview"><button type="button" id="removePreview">Remove photo</button>`; $("removePreview").onclick = () => { fileInput.value = ""; $("postPreview").innerHTML = ""; }; }; reader.readAsDataURL(file);
  };
  if (photoFirst) fileInput.click();
  $("publishPost").onclick = async () => {
    const caption = $("newCaption").value.trim(); const file = fileInput.files[0];
    if (!caption && !file) { $("postError").textContent = "Write something or add a photo first."; return; }
    const b = $("publishPost"); b.disabled = true; b.textContent = "Publishing…";
    try {
      let imageUrl = ""; if (file) imageUrl = await uploadImage(file, "posts");
      await addDoc(collection(db, "posts"), {
        uid: state.user.uid, displayName: state.profile.displayName,
        username: state.profile.username, photoURL: state.profile.photoURL || "",
        caption, imageUrl, createdAt: serverTimestamp()
      });
      closeModal(); showToast("Your post is live.", "success");
      if (state.view === "home") renderHome(); else navigate("home");
    } catch (e) { $("postError").textContent = e.message; b.disabled = false; b.textContent = "Publish post"; }
  };
}

async function renderExplore() {
  const view = $("viewRoot");
  view.innerHTML = `${pageHeader("FIND YOUR PEOPLE", "Explore", "Discover creators, conversations and fresh ideas.")}<div class="explore-search">${icon("search")}<input id="exploreQuery" placeholder="Search names, usernames or post captions…" value="${escapeHTML(state.searchTerm || "")}"><button id="clearExplore" class="text-link">Clear</button></div><div class="explore-tabs"><button class="active" data-tab="people">People</button><button data-tab="posts">Posts</button></div><section id="exploreResults">${loadingBlock("Finding your community…")}</section>`;
  const queryInput = $("exploreQuery");
  let currentTab = "people";
  const draw = () => {
    const term = queryInput.value.trim().toLowerCase(); const results = $("exploreResults"); results.replaceChildren();
    if (currentTab === "people") {
      const users = state.users.filter(u => u.uid !== state.user.uid && `${u.displayName} ${u.username} ${u.bio}`.toLowerCase().includes(term));
      if (!users.length) { results.innerHTML = emptyBlock("No people found", "Try another name or username."); return; }
      const grid = document.createElement("div"); grid.className = "people-grid";
      for (const person of users) grid.append(buildPersonCard(person)); results.append(grid);
    } else {
      const posts = state.posts.filter(p => `${p.caption || ""} ${p.displayName || ""} ${p.username || ""}`.toLowerCase().includes(term));
      if (!posts.length) { results.innerHTML = emptyBlock("No posts found", "Try a different search phrase."); return; }
      const list = document.createElement("div"); list.className = "post-list";
      for (const post of posts) { const holder = document.createElement("div"); holder.append(buildPostCard(post)); list.append(holder); }
      results.append(list);
    }
  };
  queryInput.oninput = draw;
  $("clearExplore").onclick = () => { queryInput.value = ""; state.searchTerm = ""; draw(); };
  view.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => { currentTab = b.dataset.tab; view.querySelectorAll("[data-tab]").forEach(x => x.classList.toggle("active", x === b)); draw(); });
  try { await Promise.all([fetchUsers(), fetchPosts(80)]); draw(); } catch (e) { $("exploreResults").innerHTML = emptyBlock("Explore could not load", e.message); }
}
function buildPersonCard(person) {
  const card = document.createElement("article"); card.className = "person-card";
  card.innerHTML = `<button class="person-main">${avatarHTML(person, "xl")}<strong>${escapeHTML(person.displayName || "Member")}</strong><span>@${escapeHTML(person.username || "member")}</span><p>${escapeHTML(person.bio || "A member of CODERLUME")}</p></button><div class="person-actions"><button class="btn btn-soft btn-small profile-open">View profile</button><button class="btn btn-primary btn-small message-open">Message</button></div>`;
  card.querySelector(".person-main").onclick = () => renderProfile(person.uid);
  card.querySelector(".profile-open").onclick = () => renderProfile(person.uid);
  card.querySelector(".message-open").onclick = () => { state.messageTarget = person.uid; navigate("messages"); };
  return card;
}

async function renderProfile(uid) {
  state.profileUid = uid || state.user.uid;
  state.view = "profile";
  root.querySelectorAll(".nav-item[data-view], .mobile-nav button[data-view]").forEach(button => button.classList.toggle("active", button.dataset.view === "profile"));
  const view = $("viewRoot"); view.innerHTML = loadingBlock("Opening profile…");
  try {
    const userDoc = await getDoc(doc(db, "users", state.profileUid));
    if (!userDoc.exists()) { view.innerHTML = emptyBlock("Profile not found", "This account may no longer be available."); return; }
    const person = { uid: userDoc.id, ...userDoc.data() };
    const cachedIndex = state.users.findIndex(u => u.uid === person.uid);
    if (cachedIndex >= 0) state.users[cachedIndex] = person; else state.users.push(person);
    const [postsSnap, followersSnap, followingSnap] = await Promise.all([
      getDocs(query(collection(db, "posts"), where("uid", "==", uid), limit(40))),
      getDocs(collection(db, "users", uid, "followers")),
      getDocs(collection(db, "users", uid, "following"))
    ]);
    const own = uid === state.user.uid;
    const followed = !own && (await getDoc(doc(db, "users", uid, "followers", state.user.uid))).exists();
    view.innerHTML = `<div class="profile-cover"><div class="cover-glow"></div></div><section class="profile-header"><div class="profile-avatar-wrap">${avatarHTML(person, "profile-avatar")}</div><div class="profile-head-main"><div class="profile-title-row"><div><h1>${escapeHTML(person.displayName || "Member")}</h1><span class="profile-handle">@${escapeHTML(person.username || "member")}</span></div><div class="profile-controls">${own ? '<button class="btn btn-soft" id="editProfile">Edit profile</button>' : `<button class="btn ${followed ? "btn-soft" : "btn-primary"}" id="followButton">${followed ? "Following" : "Follow"}</button><button class="btn btn-soft" id="profileMessage">Message</button>`}</div></div><p class="profile-bio">${escapeHTML(person.bio || "No bio yet.")}</p><div class="profile-stats"><span><strong>${postsSnap.size}</strong> posts</span><span><strong id="followerCount">${followersSnap.size}</strong> followers</span><span><strong>${followingSnap.size}</strong> following</span></div></div></section><div class="profile-post-heading"><h2>Posts</h2><span>Shared moments and ideas</span></div><div id="profilePosts" class="profile-posts"></div>`;
    if (own) $("editProfile").onclick = () => openEditProfile(person);
    else {
      $("followButton").onclick = () => toggleFollow(person, followed);
      $("profileMessage").onclick = () => { state.messageTarget = person.uid; navigate("messages"); };
    }
    const postsContainer = $("profilePosts");
    const orderedProfilePosts = postsSnap.docs.sort((a, b) => (b.data().createdAt?.toMillis?.() || 0) - (a.data().createdAt?.toMillis?.() || 0));
    if (postsSnap.empty) postsContainer.innerHTML = emptyBlock("No posts yet", own ? "Your posts will appear here after you share." : "This member hasn't shared a post yet.");
    else for (const d of orderedProfilePosts) { const post = { id: d.id, ...d.data() }; const wrap = document.createElement("div"); wrap.append(await buildPostCard(post)); postsContainer.append(wrap); }
  } catch (e) { view.innerHTML = emptyBlock("Could not load profile", e.message); }
}
async function toggleFollow(person, wasFollowing) {
  const followerRef = doc(db, "users", person.uid, "followers", state.user.uid);
  const followingRef = doc(db, "users", state.user.uid, "following", person.uid);
  try {
    const batch = writeBatch(db);
    if (wasFollowing) { batch.delete(followerRef); batch.delete(followingRef); }
    else {
      batch.set(followerRef, { uid: state.user.uid, createdAt: serverTimestamp() });
      batch.set(followingRef, { uid: person.uid, createdAt: serverTimestamp() });
    }
    await batch.commit(); showToast(wasFollowing ? "Unfollowed." : `You are now following ${person.displayName}.`, "success");
    renderProfile(person.uid);
  } catch (e) { showToast(`Follow update failed: ${e.message}`, "error"); }
}
function openEditProfile(person) {
  modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal-card small-modal"><button class="modal-close" data-close>${icon("close")}</button><span class="eyebrow">MAKE IT YOURS</span><h2>Edit profile</h2><div class="edit-avatar-row">${avatarHTML(person, "xl")}<label class="text-link upload-avatar">Change photo<input id="avatarFile" type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden></label></div><label class="field">Display name<input id="editName" maxlength="32" value="${escapeHTML(person.displayName || "")}"></label><label class="field">Bio<textarea id="editBio" maxlength="160">${escapeHTML(person.bio || "")}</textarea></label><p id="editProfileError" class="form-error"></p><button id="saveProfile" class="btn btn-primary btn-full">Save changes</button></section></div>`;
  bindModalClose();
  $("saveProfile").onclick = async () => {
    const displayName = $("editName").value.trim(); const bio = $("editBio").value.trim(); const file = $("avatarFile").files[0];
    if (displayName.length < 2) { $("editProfileError").textContent = "Display name must have at least 2 characters."; return; }
    const b = $("saveProfile"); b.disabled = true; b.textContent = "Saving…";
    try {
      let photoURL = person.photoURL || ""; if (file) photoURL = await uploadImage(file, "profiles");
      await updateDoc(doc(db, "users", state.user.uid), { displayName, bio, photoURL, updatedAt: serverTimestamp() });
      state.profile = { ...state.profile, displayName, bio, photoURL };
      renderUserChrome(); closeModal(); showToast("Profile updated.", "success"); renderProfile(state.user.uid);
    } catch (e) { $("editProfileError").textContent = e.message; b.disabled = false; b.textContent = "Save changes"; }
  };
}

async function renderMessages() {
  if (state.messageUnsubscribe) { state.messageUnsubscribe(); state.messageUnsubscribe = null; }
  const view = $("viewRoot");
  view.innerHTML = `${pageHeader("PRIVATE CONVERSATIONS", "Messages", "A quieter space for one-to-one conversations.")}<section class="messages-layout"><aside class="conversation-panel"><div class="conversation-panel-head"><h2>Chats</h2><button class="icon-button" id="newMessage" aria-label="Start a new message">${icon("plus")}</button></div><label class="conversation-search">${icon("search")}<input id="chatSearch" placeholder="Find a person"></label><div id="conversationList">${loadingBlock("Loading chats…")}</div><div id="peopleSearchResults" class="people-search-results"></div></aside><section class="chat-panel" id="chatPanel"><div class="chat-empty"><div class="empty-orb">✉</div><h3>Your conversations</h3><p>Choose a chat or start a new conversation with someone from the community.</p><button class="btn btn-primary" id="startNewChat">Start a conversation</button></div></section></section>`;
  $("newMessage").onclick = () => $("chatSearch").focus();
  $("startNewChat").onclick = () => $("chatSearch").focus();
  $("chatSearch").oninput = async () => {
    const term = $("chatSearch").value.trim().toLowerCase(); const target = $("peopleSearchResults"); target.innerHTML = "";
    if (!term) return;
    try {
      if (!state.users.length) await fetchUsers();
      const matches = state.users.filter(u => u.uid !== state.user.uid && `${u.displayName} ${u.username}`.toLowerCase().includes(term)).slice(0, 8);
      for (const person of matches) {
        const b = document.createElement("button"); b.className = "search-person"; b.innerHTML = `${avatarHTML(person, "sm")}<span><strong>${escapeHTML(person.displayName)}</strong><small>@${escapeHTML(person.username)}</small></span>`;
        b.onclick = () => startConversation(person); target.append(b);
      }
      if (!matches.length) target.textContent = "No people found.";
    } catch (e) { target.textContent = e.message; }
  };
  await loadConversations();
  if (state.messageTarget) {
    const target = state.users.find(u => u.uid === state.messageTarget);
    if (target) await startConversation(target);
    state.messageTarget = null;
  }
}
async function loadConversations() {
  const box = $("conversationList");
  try {
    const snap = await getDocs(query(collection(db, "conversations"), where("members", "array-contains", state.user.uid), limit(50)));
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
    box.replaceChildren();
    if (!items.length) { box.innerHTML = `<p class="muted-note">No chats yet. Search for a person to say hello.</p>`; return; }
    for (const item of items) {
      const otherUid = item.members.find(id => id !== state.user.uid);
      let person = state.users.find(u => u.uid === otherUid);
      if (!person) { const s = await getDoc(doc(db, "users", otherUid)); if (s.exists()) person = { uid: s.id, ...s.data() }; }
      if (!person) continue;
      const b = document.createElement("button"); b.className = `conversation-item ${state.activeConversationId === item.id ? "selected" : ""}`;
      b.innerHTML = `${avatarHTML(person, "md")}<span><strong>${escapeHTML(person.displayName)}</strong><small>${escapeHTML(item.lastMessage || "Start chatting")}</small></span>`;
      b.onclick = () => startConversation(person); box.append(b);
    }
  } catch (e) { box.textContent = `Could not load conversations: ${e.message}`; }
}
async function startConversation(person) {
  if (!person || person.uid === state.user.uid) return;
  if (state.messageUnsubscribe) { state.messageUnsubscribe(); state.messageUnsubscribe = null; }
  state.activeConversationUser = person;
  const members = [state.user.uid, person.uid].sort();
  const conversationId = members.join("__");
  const conversationRef = doc(db, "conversations", conversationId);
  try {
    const current = await getDoc(conversationRef);
    if (!current.exists()) await setDoc(conversationRef, { members, lastMessage: "", createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    state.activeConversationId = conversationId;
    $("peopleSearchResults").innerHTML = "";
    $("chatSearch").value = "";
    const panel = $("chatPanel");
    panel.innerHTML = `<header class="chat-header">${avatarHTML(person, "md")}<div><strong>${escapeHTML(person.displayName)}</strong><small>@${escapeHTML(person.username || "member")}</small></div></header><div id="chatMessages" class="chat-messages">${loadingBlock("Opening conversation…")}</div><form id="messageForm" class="message-form"><input id="messageInput" maxlength="2000" placeholder="Write a message…" required autocomplete="off"><button class="send-circle" aria-label="Send message">${icon("send")}</button></form>`;
    $("messageForm").onsubmit = sendMessage;
    const messageQuery = query(collection(db, "conversations", conversationId, "messages"), orderBy("createdAt", "asc"), limit(100));
    state.messageUnsubscribe = onSnapshot(messageQuery, snapshot => {
      const area = $("chatMessages"); if (!area) return;
      area.replaceChildren();
      if (snapshot.empty) area.innerHTML = `<div class="chat-empty compact"><div class="empty-orb">✦</div><h3>Say hello</h3><p>This is the beginning of your conversation.</p></div>`;
      else snapshot.forEach(d => {
        const msg = d.data(); const bubble = document.createElement("div"); bubble.className = `message-row ${msg.senderId === state.user.uid ? "mine" : "theirs"}`;
        const text = document.createElement("p"); text.textContent = msg.text || "";
        const time = document.createElement("small"); time.textContent = formatDate(msg.createdAt);
        bubble.append(text, time); area.append(bubble);
      });
      area.scrollTop = area.scrollHeight;
    }, error => { const area = $("chatMessages"); if (area) area.textContent = `Messages unavailable: ${error.message}`; });
    await loadConversations();
  } catch (e) { showToast(`Could not open chat: ${e.message}`, "error"); }
}
async function sendMessage(event) {
  event.preventDefault(); const input = $("messageInput"); const text = input.value.trim(); if (!text || !state.activeConversationId) return;
  const button = event.submitter || $("messageForm").querySelector("button"); button.disabled = true;
  try {
    await addDoc(collection(db, "conversations", state.activeConversationId, "messages"), { senderId: state.user.uid, text, createdAt: serverTimestamp() });
    await updateDoc(doc(db, "conversations", state.activeConversationId), { lastMessage: text.slice(0, 120), updatedAt: serverTimestamp() });
    input.value = ""; await loadConversations();
  } catch (e) { showToast(`Message not sent: ${e.message}`, "error"); }
  finally { button.disabled = false; input.focus(); }
}

function bindModalClose() { modalRoot.querySelectorAll("[data-close]").forEach(b => b.onclick = closeModal); modalRoot.querySelector(".modal-backdrop")?.addEventListener("click", e => { if (e.target.classList.contains("modal-backdrop")) closeModal(); }); }
function closeModal() { modalRoot.innerHTML = ""; }
function openImageViewer(url, title) {
  modalRoot.innerHTML = `<div class="image-viewer" data-close><button class="modal-close light-close" data-close>${icon("close")}</button><img src="${escapeHTML(url)}" alt="Photo shared by ${escapeHTML(title)}"></div>`;
  modalRoot.querySelector("[data-close]").onclick = closeModal;
}

// Keyboard support: Escape closes overlays; Ctrl/Cmd+K focuses search.
document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeModal();
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault(); const input = $("globalSearch"); if (input) input.focus();
  }
});

renderShell();
onAuthStateChanged(auth, async user => {
  state.user = user;
  if (!user) {
    if (state.messageUnsubscribe) state.messageUnsubscribe();
    state.profile = null;
    $("authScreen").classList.remove("hidden"); $("appScreen").classList.add("hidden");
    closeModal(); return;
  }
  $("authScreen").classList.add("hidden"); $("appScreen").classList.remove("hidden");
  try {
    await loadMyProfile();
    await fetchUsers();
    await navigate("home");
  } catch (e) {
    showToast(`Setup error: ${e.message}. Check your Firestore rules.`, "error");
  }
});
