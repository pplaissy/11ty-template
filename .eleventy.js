const pluginWebc = require("@11ty/eleventy-plugin-webc");
const markdownIt = require("markdown-it");
const markdownItAttrs = require("markdown-it-attrs");
const { DateTime } = require("luxon");

module.exports = function(eleventyConfig) {
	eleventyConfig.addPlugin(pluginWebc, {
        components: "src/_includes/components/*.webc"
  });
  
  eleventyConfig.addPassthroughCopy("src/assets");

  eleventyConfig.addJavaScriptFunction("postDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj).toLocaleString(DateTime.DATE_SHORT);
  });

  eleventyConfig.addJavaScriptFunction("url", (subUrl) => {
    if (!subUrl.startsWith('/')) subUrl = '/' + subUrl;
    return "https://code-crumbs.pplaissy.fr" + subUrl;
  });

  // eleventyConfig.addJavaScriptFunction("currentYear", () => {
  //   return DateTime.now().year;
  // });

  eleventyConfig.addCollection("posts", function(collectionApi) {
    return collectionApi.getFilteredByTag("published").sort(function(a, b) {
      return b.date - a.date; // sort by date - descending
    });
  });

  let options = {
    html: true,
    breaks: true,
    linkify: true
  };

  // set an instance of markdownIt
  const md = new markdownIt(options).use(markdownItAttrs);
  // declare a default link renderer
  const defaultLinkRender = md.renderer.rules.link_open || function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };
  // set custom render function
  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    // get the class attribute
    const classAttr = token.attrGet("class");
    // if class attribute exists and contains the external link flag...
    if (classAttr && classAttr.split(' ').includes("xlk")) {
      // ...add the custom attributes
      tokens[idx].attrSet('target', '_blank');
      tokens[idx].attrJoin("rel", "noopener noreferrer");
    }

    // Pass the token to the default renderer.
    return defaultLinkRender(tokens, idx, options, env, self);
  };

  md.renderer.rules.image = function (tokens, idx, options, env, self) {
    const token = tokens[idx];
    let src = token.attrGet('src');

    // truncate paths for local images 
    token.attrSet('src', src.slice(3));
    token.attrSet('alt', token.content);

    return self.renderToken(tokens, idx, options)
  };

  // pass the markdown instance to eleventy config
  eleventyConfig.setLibrary("md", md);

  return {
      dir: {
        input: "src",
        output: "_site",
        includes: "_includes",
        layouts: "_includes/layouts"
      }
  }
};