📘 LabPatra — Lab Manual Cover Page Maker

Create beautiful, professional lab manual cover pages in seconds.

LabPatra is a lightweight, browser-based tool designed to help students create attractive and well-organized lab manual cover pages without the hassle of designing them manually.

Choose a layout, customize the details, explore different color palettes, preview your design, and download your finished cover page—all from your browser.

✨ Features

- 🎨 Multiple Designs: Choose from six different cover page layouts.
- 🌈 24 Color Palettes: Customize the appearance of your cover page with a variety of color combinations.
- 🏫 College Branding: Include college details and a logo to personalize your design.
- ✏️ Easy Customization: Enter the information needed for your lab manual.
- 👀 Live Preview: See your design before downloading it.
- 📥 Download Your Design: Export your completed cover page as a PNG.
- 📄 PDF Export: Download an A4 PDF with the cover and the index page.
- 🗂️ Experiment Index Page: A matching index table (No., Title, Date, Page, Remark) in the same palette as your cover.
- 📝 Writing Pages: Ruled or graph pages with an optional Experiment No./Date/Aim header and page numbers, added after the index in the PDF.
- 👥 Batch Mode: Paste or load a CSV of students and download one PDF with a cover page for each (up to 100).
- 💾 Saved On Your Device: Your details, design, and logo are remembered in your browser. Nothing is uploaded.
- ⚡ No Installation Required: Runs directly in your browser.
- 🌐 Lightweight and Accessible: No build process, server, or external dependencies required for basic use.

🧭 Navigation: The front page cover maker opens first. Index, Writing pages, and Batch each have their own page in the menu bar (deep links like `#index` work).

🚀 Getting Started

Use LabPatra Online

Visit the live application:

"Open LabPatra" (https://raw9k-ai.github.io/LabPatra/)

Open the application and start creating your lab manual cover page.

Run Locally

You can also run LabPatra on your computer.

1. Clone the repository:
   
   git clone https://github.com/Raw9k-ai/LabPatra.git

2. Open the downloaded project folder.

3. Open "index.html" in your web browser.

4. Customize your cover page and download the result.

No additional installation or build steps are required.

🛠️ How to Use

1. Open LabPatra in your browser.
2. Enter the required academic and laboratory details.
3. Choose a cover page layout.
4. Select a color palette that suits your preference.
5. Add or customize the college logo, where supported.
6. Preview the finished design.
7. Download your cover page.

Your cover page is ready to use in your lab manual.

🧩 Project Structure

The project uses HTML, CSS, and JavaScript to generate and customize cover page designs.

LabPatra/
├── index.html          # Main application interface
├── style.css           # Application styling
├── app.js              # Application logic and interactions
├── helpers.js          # Drawing and utility functions
├── layouts.js          # Cover page layout designs
├── index-page.js        # Experiment index page layout
├── lined-page.js        # Ruled / graph writing pages
├── pdf.js               # Minimal PDF writer (no libraries)
├── logo.js             # Default college logo
├── palettes.js         # Color palette definitions
├── 1789061596402.png   # Project image asset
├── LICENSE             # Project license
└── README.md           # Project documentation

🎨 Customizing LabPatra

LabPatra is designed to be extended with additional layouts and color schemes.

Add a Color Palette

Add a new palette to "PALETTE_DATA" in "palettes.js", following the existing palette structure.

Add a Cover Page Layout

1. Create a new drawing function in "layouts.js".
2. Register the function in "LAYOUTS".
3. Associate the layout with the appropriate color palettes.

Follow the existing code structure to maintain compatibility with the application.

💻 Technologies Used

- HTML5 — Application structure.
- CSS3 — Styling and responsive presentation.
- JavaScript — Cover page customization, drawing, preview, and download functionality.
- HTML Canvas — Rendering graphical cover page designs.

🎯 Who Is LabPatra For?

LabPatra is useful for:

- College and university students.
- Engineering and science students.
- Students preparing practical records and laboratory manuals.
- Anyone who needs a clean, professional lab manual cover page.

🔮 Future Improvements

Potential enhancements include:

- Additional cover page templates.
- More customizable fonts and typography.
- More options for college branding.
- Custom colour picker and font choices.
- Shareable links with prefilled details.

📄 License

This project is distributed under the MIT License. See the "LICENSE" (LICENSE) file for details.

👨‍💻 Author

Developed by Raw9k-ai.

Explore the source code and contribute to the project:

"GitHub Repository" (https://github.com/Raw9k-ai/LabPatra)

---

<p align="center">
  Made with ❤️ to make lab manual design easier for students.
</p>
