=== Lovarank ===
Contributors: eugenezolo  
Tags: seo, content automation, article sync, ai blog  
Requires at least: 6.4  
Tested up to: 6.8  
Requires PHP: 8.0  
Stable tag: 1.0.2  
License: GPLv2 or later  
License URI: https://www.gnu.org/licenses/gpl-2.0.html  

Lovarank automatically creates and publishes SEO-optimized articles to your WordPress site as blog posts or drafts.

== Description ==

Grow Organic Traffic Without Lifting a Finger.

Lovarank is your behind-the-scenes content team powered by AI. It creates high-quality, SEO-optimized blog posts that drive traffic to your WordPress site – automatically. No brainstorming, no writing, no scheduling. Just pure growth on autopilot.

Lovarank plugin may embed external links or credits on the public site.

The plugin provides secure API access to retrieve your published posts for content analysis and optimization within the Lovarank app.

== Features ==

1. Fully automatic content creation and keyword research – find hidden keyword gems and publish optimized articles daily.
2. Write in 150+ languages – speak to your audience wherever they are.
3. One-click integration with WordPress – set it up once and your content gets published like magic.
4. SEO-friendly, fact-checked articles with media – includes internal links, videos, images, and credible citations.
5. Your voice, your tone – match your brand’s style with AI-tuned tone control.
6. Up to 4000 words per article – long-form, evergreen content designed to rank and convert.
7. Smart daily publishing plan – a tailored 30-day strategy to keep content flowing.
8. Multi-user and multi-site support – manage teams and scale across sites easily.

== Installation ==

1. Upload the plugin folder to `/wp-content/plugins/` or install via the WordPress admin.
2. Activate the plugin from the “Plugins” page.
3. Navigate to **Lovarank → Manage** in your admin menu.
4. Enter your API key and select publish mode.
5. Click **Sync Articles** to manually fetch content or let it sync daily via cron.

== Screenshots ==

1. Grow Organic Traffic on Autopilot.
2. The Sync Dashboard and Setup Page.
3. AI-generated blog posts ready to publish.

== External services ==

This plugin connects to the Lovarank API to fetch blog article content for your site. This is necessary to sync AI-generated content to your WordPress posts.

Data sent:
- API Key (stored by user in plugin settings)

Data is sent when:
- Manual sync is triggered or daily sync runs via cron.

External Service:
- [Lovarank API](https://lovarank.com)
- [Privacy Policy](https://lovarank.com/privacy-policy)
- [Terms of Use](https://lovarank.com/terms-of-use)

== Frequently Asked Questions ==

= Does this plugin automatically post articles? =  
Yes. You can choose whether articles are saved as drafts or published instantly.

= How does the sync work? =  
Lovarank sends a secure request to your content API daily and stores unique articles in your site.

= Can I sync manually? =  
Yes, there is a **Sync Articles** button in the dashboard for instant updates.

== Changelog ==

= 1.0.2 =
* Fixed YouTube video embedding in synced articles

= 1.0.1 =
* Added posts fetching endpoint for retrieving published blog posts
* Added API access functionality for content analysis and optimization
* Various bug fixes and improvements

= 1.0.0 =
* Initial release.
* Admin dashboard with API key and post settings.
* Manual and automatic article syncing via cron.

== Upgrade Notice ==

= 1.0.0 =
First release — includes cron sync, manual sync, and support for draft/publish modes.