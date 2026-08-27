import assert from "node:assert/strict";
import test from "node:test";

import { isLikelyPublicSourceUrl } from "../lib/source-access.ts";

test("accepts a clear public Facebook page post", () => {
  assert.equal(
    isLikelyPublicSourceUrl("https://www.facebook.com/mcsteel/posts/123456789"),
    true,
  );
});

test("accepts clear Facebook reel, video, and watch URLs", () => {
  assert.equal(isLikelyPublicSourceUrl("https://facebook.com/reel/123456789"), true);
  assert.equal(isLikelyPublicSourceUrl("https://facebook.com/mcsteel/videos/123456789"), true);
  assert.equal(isLikelyPublicSourceUrl("https://facebook.com/watch/?v=123456789"), true);
});

test("rejects Facebook group, share, and Marketplace links", () => {
  assert.equal(isLikelyPublicSourceUrl("https://facebook.com/groups/steel/posts/123"), false);
  assert.equal(isLikelyPublicSourceUrl("https://facebook.com/share/p/abc123"), false);
  assert.equal(isLikelyPublicSourceUrl("https://facebook.com/marketplace/item/123"), false);
});

test("rejects unclear Facebook profile, story, photo, and page-root links", () => {
  assert.equal(isLikelyPublicSourceUrl("https://facebook.com/profile.php?id=123"), false);
  assert.equal(isLikelyPublicSourceUrl("https://facebook.com/story.php?story_fbid=123"), false);
  assert.equal(isLikelyPublicSourceUrl("https://facebook.com/photo/?fbid=123"), false);
  assert.equal(isLikelyPublicSourceUrl("https://facebook.com/mcsteel"), false);
});

test("does not restrict valid non-Facebook platform URLs", () => {
  assert.equal(isLikelyPublicSourceUrl("https://instagram.com/p/example"), true);
  assert.equal(isLikelyPublicSourceUrl("https://threads.com/@buyer/post/example"), true);
  assert.equal(isLikelyPublicSourceUrl("https://tiktok.com/@buyer/video/123"), true);
});

test("rejects invalid and non-web URLs", () => {
  assert.equal(isLikelyPublicSourceUrl("not-a-url"), false);
  assert.equal(isLikelyPublicSourceUrl("ftp://facebook.com/mcsteel/posts/123"), false);
});
