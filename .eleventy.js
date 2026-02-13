module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/CNAME");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/fonts");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy({
    "node_modules/@melloware/coloris/dist": "vendor/coloris"
  });
  eleventyConfig.addPassthroughCopy({
    "node_modules/color-name-list/dist": "vendor/color-name-list"
  });
  eleventyConfig.addPassthroughCopy({ "packages/tints-and-shades/dist": "packages/tints-and-shades/dist" });
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
