# **Sui Hub AI**

## **About the Project**  
Sui Hub AI is an AI Marketing Department that can help you generate content / chatting / do onchain activity with others teammates autonomosly. The project is designed to create an innovative user experience with a flexible architecture and scalable components. This document will help you set up and run each part of the system with detailed instructions.

---

## **Running the Frontend**  
The frontend is the client-side part of the project that provides the user interface and interaction with the system. Follow these steps to run it:

1. Navigate to the `frontend` folder.  
2. Ensure that the `.env` file matches the `.env.example` file in the `frontend` folder.  
3. Install all necessary dependencies.  
4. Start the development server.

### **Commands:**  
```bash
cd frontend
npm install    # or yarn install | pnpm install
npm run dev    # or yarn dev | pnpm dev
```

By default, the application will be available at `http://localhost:3000`.

---

## **Running the Backend**  
The backend is the server-side part of the system, responsible for data processing and database interaction.

### **Steps to Run:**  
1. Navigate to the `backend` folder.  
2. Check that the `.env` file exists and matches the `.env.example` file in this folder.  
3. Install dependencies.  
4. Start the server.

### **Commands:**  
```bash
cd backend
npm install    # or yarn install | pnpm install
npm run dev    # or yarn dev | pnpm dev
```

The server will be running on port `3001` (`http://localhost:3001`).

---

## **Running Eliza-Starter**  
Eliza-Starter is an additional component that extends the project’s functionality.

### **Steps to Run:**  
1. Navigate to the `eliza-starter` folder.  
2. Ensure that the `.env` file is correctly configured.  
3. Install all dependencies.  
4. Start the application.

### **Commands:**  
```bash
cd eliza-starter
npm install    # or yarn install | pnpm install
npm start      # or yarn start | pnpm start
```

---

## **Environment Variables (ENV)**  
Environment variables (`.env`) are essential for the correct functioning of all project components. Make sure that all necessary variables are specified and match the example `.env.example`.

### **Sample .env File:**  
```bash
REACT_APP_API_URL=http://localhost:3000
NODE_ENV=development
```

---

## **Installation Recommendations**  
- Ensure you have Node.js (version >= 22) and a package manager (`npm`, `yarn`, or `pnpm`) installed.  
- Use the same package manager strategy for all components (e.g., always use `npm` or `yarn`).  
- If errors occur, verify that environment variables are set correctly.
