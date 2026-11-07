
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";

import {
  getAuth, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

import {
  getFirestore, collection, addDoc, getDocs,
  query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAElXjr0wHQRRngfzgTlqub6HM6V_Cy4FE",
  authDomain: "coderlume.firebaseapp.com",
  projectId: "coderlume",
  storageBucket: "coderlume.firebasestorage.app",
  messagingSenderId: "493035320543",
  appId: "1:493035320543:web:df23a2ce5dea0962c9a56a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const CLOUD_NAME = "jsx5prhc";
const UPLOAD_PRESET = "coderlume_uploads";

const root = document.getElementById("app");

root.innerHTML = `
<div class="brand">
  <img src="coderlume-logo.png" alt="CODERLUME" onerror="this.style.display='none'">
  <span>CODERLUME</span>
</div>

<section id="authBox" class="auth-panel">
  <div class="auth-art">
    <span class="eyebrow">YOUR WORLD. YOUR COMMUNITY.</span>
    <h1>Connect beyond<br><span>boundaries.</span></h1>
    <p>Discover people, share moments and create your digital world.</p>
  </div>
  <div class="auth-form">
    <h2>Welcome back</h2>
    <p>Join the CODERLUME community.</p>
    <input id="email" type="email" placeholder="Email address">
    <input id="password" type="password" placeholder="Password">
    <button id="login" class="primary">Sign in</button>
    <button id="signup" class="secondary">Create your account</button>
    <p id="message" class="notice"></p>
  </div>
</section>

<section id="socialBox" hidden>
  <aside class="sidebar">
    <h2>CODERLUME</h2>
    <button data-page="Home">⌂ &nbsp; Home</button>
    <button data-page="Explore">⌕ &nbsp; Explore</button>
    <button data-page="Messages">✉ &nbsp; Messages</button>
    <button data-page="Notifications">♡ &nbsp; Notifications</button>
    <button data-page="Profile">◉ &nbsp; Profile</button>
    <button id="logout">↪ &nbsp; Log out</button>
  </aside>

  <main class="main-content">
    <header class="topbar">
      <div>
        <span class="eyebrow">WELCOME TO YOUR COMMUNITY</span>
        <h1 id="pageTitle">Your Feed</h1>
      </div>
      <div class="user-chip" id="userChip">● Online</div>
    </header>

    <section class="stories">
      <h2>Discover moments</h2>
      <div class="story-list">
        <div class="story"><div class="story-ring">＋</div><span>Your story</span></div>
        <div class="story"><div class="story-ring">✦</div><span>Creators</span></div>
        <div class="story"><div class="story-ring">⚡</div><span>Trending</span></div>
        <div class="story"><div class="story-ring">♡</div><span>Community</span></div>
      </div>
    </section>

    <section class="composer">
      <h2>Share something amazing</h2>
      <textarea id="caption" placeholder="What's happening in your world?"></textarea>
      <div class="composer-bottom">
        <input id="media" type="file" accept="image/jpeg,image/png,image/webp">
        <button id="publish" class="primary">＋ Publish post</button>
      </div>
      <p id="postMessage" class="notice"></p>
    </section>

    <section class="feed-section">
      <h2>Latest posts</h2>
      <div id="feed">Loading your feed...</div>
    </section>
  </main>

  <aside class="right-panel">
    <div class="welcome-card">
      <span class="eyebrow">THE CODERLUME EXPERIENCE</span>
      <h2>Be seen.<br>Be creative.</h2>
      <p>Your space to connect and share.</p>
    </div>
    <div class="suggestion-card">
      <h3>Community guidelines</h3>
      <p>Be respectful. Share responsibly. Keep your account secure.</p>
    </div>
  </aside>
</section>
`;

const $ = id => document.getElementById(id);

$("signup").onclick = async () => {
  try {
    await createUserWithEmailAndPassword(
      auth, $("email").value.trim(), $("password").value
    );
    $("message").textContent = "Account created!";
  } catch (e) {
    $("message").textContent = e.message;
  }
};

$("login").onclick = async () => {
  try {
    await signInWithEmailAndPassword(
      auth, $("email").value.trim(), $("password").value
    );
  } catch (e) {
    $("message").textContent = e.message;
  }
};

$("logout").onclick = () => signOut(auth);

async function loadFeed() {
  const feed = $("feed");
  feed.textContent = "Loading posts...";

  try {
    const q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    feed.replaceChildren();

    if (snapshot.empty) {
      feed.innerHTML = "<p class='empty'>No posts yet. Start the conversation!</p>";
      return;
    }

    snapshot.forEach(doc => {
      const post = doc.data();
      const card = document.createElement("article");
      card.className = "post-card";

      const author = document.createElement("strong");
      author.textContent = post.email || "CODERLUME member";

      const caption = document.createElement("p");
      caption.textContent = post.caption || "";

      card.append(author, caption);

      if (post.imageUrl) {
        const img = document.createElement("img");
        img.src = post.imageUrl;
        img.alt = "Community post";
        img.loading = "lazy";
        card.append(img);
      }

      feed.append(card);
    });
  } catch (e) {
    feed.textContent = "Feed error: " + e.message;
  }
}

$("publish").onclick = async () => {
  const user = auth.currentUser;
  const file = $("media").files[0];
  const caption = $("caption").value.trim();

  if (!caption && !file) {
    $("postMessage").textContent = "Add a caption or choose an image.";
    return;
  }

  try {
    $("publish").disabled = true;
    $("postMessage").textContent = "Publishing...";

    let imageUrl = "";

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Choose an image smaller than 5 MB.");
      }

      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", UPLOAD_PRESET);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: data }
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error?.message || "Image upload failed.");
      }
      imageUrl = result.secure_url;
    }

    await addDoc(collection(db, "posts"), {
      uid: user.uid,
      caption,
      imageUrl,
      createdAt: serverTimestamp()
    });

    $("caption").value = "";
    $("media").value = "";
    $("postMessage").textContent = "Your post is published!";
    await loadFeed();

  } catch (e) {
    $("postMessage").textContent = e.message;
  } finally {
    $("publish").disabled = false;
  }
};

document.querySelectorAll("[data-page]").forEach(button => {
  button.onclick = () => {
    const page = button.dataset.page;
    $("pageTitle").textContent =
      page === "Home" ? "Your Feed" : page;
    if (page === "Home") loadFeed();
    else alert(page + " section is coming in a future update.");
  };
});

onAuthStateChanged(auth, user => {
  $("authBox").hidden = !!user;
  $("socialBox").hidden = !user;

  if (user) {
    $("userChip").textContent = user.email;
    loadFeed();
  }
});
