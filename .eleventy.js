const dateFilter = require('nunjucks-date-filter');

module.exports = function (eleventyConfig) {
  eleventyConfig.addNunjucksFilter('date', dateFilter);
  eleventyConfig.addPassthroughCopy("src/CNAME");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/fonts");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/*.svg");
  eleventyConfig.addPassthroughCopy("src/*.png");
  eleventyConfig.addPassthroughCopy("src/*.ico");
  eleventyConfig.addPassthroughCopy("src/*.webmanifest");

  eleventyConfig.setServerOptions({
    watch: ["./_site/css/**/*.css"]
  });

  return {
    dir: {
      input: "src",
      output: "_site"
    }
  };
};