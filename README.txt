CODERLUME — COMPLETE FRONT-END PACKAGE
======================================

Files
-----
index.html       App entry point
style.css        Responsive premium UI
app.js           Firebase Auth + Firestore + Cloudinary functionality
firestore.rules  Firestore security rules for this app

DEPLOYMENT
----------
1. Open your GitHub repository:
   https://github.com/codervaibhavrinwa65-cvdon/coderlume
2. Replace the contents of index.html, style.css and app.js with the files in this package.
3. Upload firestore.rules to your computer and copy its contents into:
   Firebase Console > CODERLUME > Build > Firestore Database > Rules
   Then click Publish.
4. In Firebase Console > Authentication > Settings > Authorized domains,
   make sure this exact domain is present:
   codervaibhavrinwa65-cvdon.github.io
5. In Cloudinary, the upload preset named coderlume_uploads must be set to
   unsigned. The app accepts JPG, PNG, WEBP and GIF images up to 8 MB.
6. Wait for GitHub Pages to finish its deployment, then open:
   https://codervaibhavrinwa65-cvdon.github.io/coderlume/
7. Hard refresh using Ctrl+Shift+R.

FEATURES INCLUDED
-----------------
- Email/password registration, sign-in, sign-out and password reset.
- User profile with display name, bio and profile photo.
- Create text/image posts, community feed, likes, comments and own-post deletion.
- Explore/search users and posts.
- Follow/unfollow members and view follower/following counts.
- Image stories that expire after 24 hours; view and delete your own stories.
- One-to-one text messaging with live message updates.
- Responsive desktop and mobile navigation.

IMPORTANT LIMITATIONS / SAFETY
------------------------------
- The code is a working app foundation, not a guarantee of a production-perfect
  or Instagram-scale service. Test with a small number of accounts first.
- Cloudinary unsigned uploads are publicly callable. Client-side image size/type
  checks are not a security boundary. Configure allowed formats, max file size,
  and a dedicated upload folder in Cloudinary. For a public production launch,
  move uploads behind a trusted server or Cloudinary signed-upload endpoint.
- Firestore rules protect database records; they do not moderate content or
  prevent spam. Add reporting, blocking, moderation and rate limits before
  inviting a large public audience.
- Stories are hidden after 24 hours by app queries; Firestore documents are not
  automatically deleted. Configure a server-side scheduled cleanup if desired.
- Explore currently searches a bounded client-side sample (up to 120 profiles
  and 80 recent posts), not a global full-text index.
- Messages are text-only. There is no group chat, message deletion, read receipt,
  push notification or end-to-end encryption in this package.
- Username is generated automatically and not editable in this version.
