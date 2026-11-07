
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// FIREBASE CONFIGURATION
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
root.style.cssText =
  "display:block;text-align:left;max-width:850px;margin:auto;padding:24px;width:100%";

root.innerHTML = `
  <h1 style="text-align:center">CODERLUME</h1>
  <p style="text-align:center">Connect. Create. Share.</p>

  <section id="authBox">
    <h2>Welcome to CODERLUME</h2>
    <input id="email" type="email" placeholder="Email"><br><br>
    <input id="password" type="password" placeholder="Password"><br><br>
    <button id="signup">Create Account</button>
    <button id="login">Login</button>
    <p id="message"></p>
  </section>

  <section id="socialBox" hidden>
    <p id="welcome"></p>
    <button id="logout">Logout</button>
    <hr>
    <h2>Create a post</h2>
    <textarea id="caption" placeholder="Write something..."></textarea><br><br>
    <input id="media" type="file" accept="image/jpeg,image/png,image/webp">
    <br><br>
    <button id="publish">Publish Post</button>
    <p id="postMessage"></p>
    <hr>
    <h2>Explore Feed</h2>
    <div id="feed">Loading posts...</div>
  </section>
`;

const $ = id => document.getElementById(id);

$("signup").onclick = async () => {
  try {
    const credential = await createUserWithEmailAndPassword(
      auth, $("email").value, $("password").value
    );
    $("message").textContent = "Account created successfully!";
  } catch (error) {
    $("message").textContent = error.message;
  }
};

$("login").onclick = async () => {
  try {
    await signInWithEmailAndPassword(
      auth, $("email").value, $("password").value
    );
  } catch (error) {
    $("message").textContent = error.message;
  }
};

$("logout").onclick = () => signOut(auth);

$("publish").onclick = async () => {
  const user = auth.currentUser;
  const file = $("media").files[0];
  const caption = $("caption").value.trim();

  if (!caption && !file) {
    $("postMessage").textContent = "Write a caption or select an image.";
    return;
  }

  try {
    $("postMessage").textContent = "Publishing...";

    let imageUrl = "";

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Image must be smaller than 5 MB.");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || "Upload failed");

      imageUrl = result.secure_url;
    }

    await addDoc(collection(db, "posts"), {
      uid: user.uid,
      email: user.email,
      caption,
      imageUrl,
      createdAt: serverTimestamp()
    });

    $("caption").value = "";
    $("media").value = "";
    $("postMessage").textContent = "Post published!";
    await loadFeed();

  } catch (error) {
    $("postMessage").textContent = error.message;
  }
};

async function loadFeed() {
  const feed = $("feed");
  feed.textContent = "Loading posts...";

  try {
    const postsQuery = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(postsQuery);
    feed.replaceChildren();

    if (snapshot.empty) {
      feed.textContent = "No posts yet. Be the first to publish!";
      return;
    }

    snapshot.forEach(postDoc => {
      const post = postDoc.data();
      const card = document.createElement("article");
      card.style.cssText =
        "background:#202943;padding:18px;margin:16px 0;border-radius:12px";

      const author = document.createElement("strong");
      author.textContent = post.email || "CODERLUME user";

      const caption = document.createElement("p");
      caption.textContent = post.caption || "";

      card.append(author, caption);

      if (post.imageUrl) {
        const image = document.createElement("img");
        image.src = post.imageUrl;
        image.alt = "User post";
        image.style.cssText =
          "width:100%;max-height:450px;object-fit:contain;margin-top:12px";
        card.append(image);
      }

      feed.append(card);
    });

  } catch (error) {
    feed.textContent = "Could not load posts: " + error.message;
  }
}

onAuthStateChanged(auth, user => {
  $("authBox").hidden = !!user;
  $("socialBox").hidden = !user;

  if (user) {
    $("welcome").textContent = "Logged in as " + user.email;
    loadFeed();
  }
});
