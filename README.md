<div align="center">
<img width="1200" height="475" alt="GHBanner" src="" />
</div>
 
 # Fractal EDU - Student Profiler & Growth Analysis
 
 Welcome to the Fractal EDU application, a comprehensive tool designed for educators to manage student profiles, classes, and analyze exam performance. This application is built with React and Vite, providing a fast and modern development experience.
 
 ## ✨ Features
 
 - **Student Profiler**: Manage detailed student profiles, including personal information, academic history, and behavioral notes.
 - **Class Management**: Create and organize classes, assign students, and manage class lists.
 - **Seating Charts**: Design and save multiple seating arrangements for each class.
 - **Exam Analysis Tool**: Input exam results to generate insightful analytics on student and class performance against syllabus dot-points.
 - **Data Portability**: Easily import and export data, including student lists (CSV), full backups, and shared exam analysis files.
 - **Dark Mode**: A sleek, user-friendly interface with a toggle for light and dark themes.
 
 ## 🚀 Getting Started
 
 ### Prerequisites
 
 - Node.js (v18 or higher recommended)
 - npm (or your package manager of choice)
 
 ### Installation & Local Development
 
 1.  **Clone the repository:**
     ```bash
     git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
     cd YOUR_REPOSITORY
     ```
 
 2.  **Install dependencies:**
     ```bash
     npm install
     ```
 
 3.  **Run the development server:**
     ```bash
     npm run dev
     ```
     The application will be available at `http://localhost:5173` (or the next available port).
 
 ## 🛠️ Building for Production
 
 To create a production-ready build of your app, run:
 
 ```bash
 npm run build
 ```
 
 This command generates a `dist` folder with optimized static assets that can be deployed to any web hosting service.
 
 ## 🚀 Deployment
 
 This repository is configured for automatic deployment to **GitHub Pages**. A GitHub Actions workflow located in `.github/workflows/deploy.yml` will trigger on every push to the `main` branch.
 
 To enable this, you will need to:
 1.  Go to your repository's **Settings > Pages**.
 2.  Under "Build and deployment", select **GitHub Actions** as the source.
