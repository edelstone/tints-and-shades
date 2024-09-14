// e.g., whether the user wants copying to use a hashtag or not
const settings = {
  copyWithHashtag: false
};

// Load the state from localStorage
const loadSettings = () => {
  const savedSettings = localStorage.getItem('settings');
  if (savedSettings) {
    Object.assign(settings, JSON.parse(savedSettings));
  }
};

// Save the state to localStorage
const saveSettings = () => {
  localStorage.setItem('settings', JSON.stringify(settings));
};

// Initialize the settings and checkbox state
const initializeSettings = () => {
  loadSettings();
  const checkbox = document.getElementById('copy-with-hashtag');
  if (checkbox) {
    checkbox.checked = settings.copyWithHashtag;
    checkbox.addEventListener('change', () => {
      settings.copyWithHashtag = checkbox.checked;
      saveSettings();
    });
  }
};

// Call initializeSettings when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeSettings);

// Parse an input string, looking for any number of hexadecimal color values, possibly with whitespace or garbage in between. Return an array of color values. Supports hex shorthand.
const parseColorValues = (colorValues) => {
  let colorValuesArray = colorValues.match(/\b[0-9A-Fa-f]{3}\b|[0-9A-Fa-f]{6}\b/g);
  if (colorValuesArray) {
    colorValuesArray = colorValuesArray.map(item => {
      if (item.length === 3) {
        return item.split('').reduce((acc, it) => acc + it + it, '');
      }
      return item;
    });
  }
  return colorValuesArray; // this could be null if there are no matches
};

// Pad a hexadecimal string with zeros if it needs it
const pad = (number, length) => {
  let str = number.toString();
  while (str.length < length) {
    str = '0' + str;
  }
  return str;
};

// Convert a hex string into an object with red, green, blue numeric properties
// '501214' => { red: 80, green: 18, blue: 20 }
const hexToRGB = (colorValue) => ({
  red: parseInt(colorValue.substr(0, 2), 16),
  green: parseInt(colorValue.substr(2, 2), 16),
  blue: parseInt(colorValue.substr(4, 2), 16)
});

// Convert an integer to a 2-char hex string
// for sanity, round it and ensure it is between 0 and 255
// 43 => '2b'
const intToHex = (rgbint) => pad(Math.min(Math.max(Math.round(rgbint), 0), 255).toString(16), 2);

// Convert one of our rgb color objects to a full hex color string
// { red: 80, green: 18, blue: 20 } => '501214'
const rgbToHex = (rgb) => intToHex(rgb.red) + intToHex(rgb.green) + intToHex(rgb.blue);

// Shade one of our rgb color objects to a distance of i*10%
// ({ red: 80, green: 18, blue: 20 }, 1) => { red: 72, green: 16, blue: 18 }
const rgbShade = (rgb, i) => ({
  red: rgb.red * (1 - 0.1 * i),
  green: rgb.green * (1 - 0.1 * i),
  blue: rgb.blue * (1 - 0.1 * i)
});

// Tint one of our rgb color objects to a distance of i*10%
// ({ red: 80, green: 18, blue: 20 }, 1) => { red: 98, green: 42, blue: 44 }
const rgbTint = (rgb, i) => ({
  red: rgb.red + (255 - rgb.red) * i * 0.1,
  green: rgb.green + (255 - rgb.green) * i * 0.1,
  blue: rgb.blue + (255 - rgb.blue) * i * 0.1
});

// Take a hex color string and produce a list of 10 tints or shades of that color
// shadeOrTint should be either `rgbShade` or `rgbTint`, as defined above
// this allows us to use `calculate` for both shade and tint
const calculate = (colorValue, shadeOrTint) => {
  const color = hexToRGB(colorValue);
  const shadeValues = [];

  for (let i = 0; i < 10; i++) {
    shadeValues[i] = rgbToHex(shadeOrTint(color, i));
  }
  return shadeValues;
};

// Given a color value, return an array of ten shades in 10% increments
const calculateShades = (colorValue) => calculate(colorValue, rgbShade).concat("000000");

// Given a color value, return an array of ten tints in 10% increments
const calculateTints = (colorValue) => calculate(colorValue, rgbTint).concat("ffffff");

const updateClipboardData = () => {
  // Basically, all cells that have a data-clipboard-text attribute
  const colorCells = document.querySelectorAll("#tints-and-shades td[data-clipboard-text]");
  colorCells.forEach(cell => {
    const colorCode = cell.getAttribute("data-clipboard-text");

    if (settings.copyWithHashtag) {
      cell.setAttribute("data-clipboard-text", `#${colorCode}`);
    } else {
      // Strip the existing hashtag from the color code
      cell.setAttribute("data-clipboard-text", colorCode.substr(1));
    }
  });
};

// Create a table row holding either the color values as blocks of color
// or the hexadecimal color values in table cells, depending on the parameter 'displayType'
const makeTableRowColors = (colors, displayType) => {
  let tableRow = "<tr>";
  colors.forEach(color => {
    const colorHex = color.toString(16);
    if (displayType === "colors") { // Make a row of colors
      // We have to account for the prefix here in case the user toggled the checkbox before generating another palette
      const colorPrefix = settings.copyWithHashtag ? "#" : "";
      tableRow += `<td tabindex="0" role="button" aria-label="Color swatch" class="hex-color" style="background-color:#${colorHex}" data-clipboard-text="${colorPrefix}${colorHex}"></td>`;
    } else { // Make a row of RGB values
      tableRow += `<td class="hex-value">${colorHex.toUpperCase()}</td>`;
    }
  });
  tableRow += "</tr>";
  return tableRow;
};

const createTintsAndShades = (firstTime) => {
  const parsedColorsArray = parseColorValues(document.getElementById("color-values").value);
  if (parsedColorsArray !== null) {
    // Make sure we got valid color values back from parsing
    const colorDisplayRows = []; // Holds HTML table rows for the colors to display
    let tableRowCounter = 0;

    parsedColorsArray.forEach(color => { // Iterate through each inputted color value
      // Calculate an array of shades from the inputted color, then make a table row from the shades, and a second table row for the hex values of the shades
      const calculatedShades = calculateShades(color);
      colorDisplayRows[tableRowCounter] = makeTableRowColors(calculatedShades, "colors");
      tableRowCounter++;
      colorDisplayRows[tableRowCounter] = makeTableRowColors(calculatedShades, "RGBValues");
      tableRowCounter++;

      // Calculate an array of tints from the inputted color, then make a table row from the tints, and a second table row for the hex values of the tints
      const calculatedTints = calculateTints(color);
      colorDisplayRows[tableRowCounter] = makeTableRowColors(calculatedTints, "colors");
      tableRowCounter++;
      colorDisplayRows[tableRowCounter] = makeTableRowColors(calculatedTints, "RGBValues");
      tableRowCounter++;
    });

    // Wrap the rows into an HTML table with a hard-coded header row
    const colorDisplayTable = `<table><thead><tr class="table-header"><td><span>0%</span></td><td><span>10%</span></td><td><span>20%</span></td><td><span>30%</span></td><td><span>40%</span></td><td><span>50%</span></td><td><span>60%</span></td><td><span>70%</span></td><td><span>80%</span></td><td><span>90%</span></td><td><span>100%</span></td></tr></thead>${colorDisplayRows.join("")}</table>`;

    // Replace tints-and-shades div with color display table wrapped by the same div
    document.getElementById("tints-and-shades").innerHTML = colorDisplayTable;

    // Set URL hash to a comma-separated list of hex codes
    window.location.hash = parsedColorsArray.join(",");

    // Custom smooth scroll function
    const smoothScrollTo = (element, duration) => {
      const targetPosition = element.getBoundingClientRect().top + window.scrollY;
      const startPosition = window.scrollY;
      const distance = targetPosition - startPosition;
      let startTime = null;

      const animation = (currentTime) => {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const run = ease(timeElapsed, startPosition, distance, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) requestAnimationFrame(animation);
      };

      const ease = (t, b, c, d) => {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
      };

      requestAnimationFrame(animation);
    };

    // Scroll down to show the tints-and-shades div
    const scrollElement = document.getElementById("scroll-top");
    if (scrollElement) {
      smoothScrollTo(scrollElement, 500);
    } else {
      console.error("Element with id 'scroll-top' not found.");
    }

    // Set focus to the color display table
    setTimeout(() => {
      const tintsAndShades = document.getElementById("tints-and-shades");
      tintsAndShades.setAttribute("tabindex", "0");
      tintsAndShades.focus();
    });

    // When color display table loses focus, make it not focusable again
    document.getElementById("tints-and-shades").addEventListener("blur", () => {
      document.getElementById("tints-and-shades").setAttribute("tabindex", "-1");
    });
  } else if (!firstTime) { // Doesn't run on page load (the first time it runs)
    // Scroll back to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Remove any existing content from tints-and-shades div
    document.getElementById("tints-and-shades").innerHTML = "";

    // Reset the URL hash
    window.location.hash = "";

    // Show warning
    document.getElementById("warning").classList.add("visible");

    // Hide warning after 3 seconds
    setTimeout(() => {
      document.getElementById("warning").classList.remove("visible");
    }, 3000);

    // Set focus back to the text area
    document.getElementById("color-values").focus();
  }
  return false;
};

// Main application code. Parse the inputted color numbers, make an HTML with the colors in it, and render the table into the page.
document.addEventListener("DOMContentLoaded", () => {
  // Get URL hash and set it as the text area value
  const colorValuesElement = document.getElementById("color-values");
  if (colorValuesElement) {
    colorValuesElement.value = window.location.hash.slice(1).replace(/,/g, " ");
  } else {
    console.error("Element with id 'color-values' not found.");
  }

  // Create tints and shades with hash hex codes
  createTintsAndShades(true);

  // Connect the form submit button to all of the guts
  const colorEntryForm = document.getElementById("color-entry-form");
  if (colorEntryForm) {
    colorEntryForm.addEventListener("submit", (e) => {
      e.preventDefault();
      createTintsAndShades();
    });
  } else {
    console.error("Element with id 'color-entry-form' not found.");
  }

  const copyWithHashtagCheckbox = document.getElementById("copy-with-hashtag");
  if (copyWithHashtagCheckbox) {
    copyWithHashtagCheckbox.addEventListener("change", (e) => {
      settings.copyWithHashtag = e.target.checked;
      // This will just fail-fast if the tables haven't been generated yet
      updateClipboardData();
    });
  } else {
    console.error("Element with id 'copy-with-hashtag' not found.");
  }
});

// Checks if the enter key is pressed and simulates a click on the focused element
document.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    document.activeElement.click();
  }
});

// Show a new Carbon ad every time certain elements are clicked
document.addEventListener('click', (event) => {
  if (event.target.id === 'make') {
    // If the ad hasn't loaded yet, don't refresh or it will return multiple ads
    if (!document.getElementById("carbonads")) return;
    // If the script hasn't loaded, don't try calling it
    if (typeof _carbonads !== 'undefined') _carbonads.refresh();
  }
});