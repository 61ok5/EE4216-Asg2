# EE4216-Asg2: Web-based To-Do App

This project is a full-stack web application that enables users to create, read, update, and delete tasks in a to-do list. The backend is built with Spring Boot and Maven, utilizing RESTful API endpoints for CRUD operations on the to-do list. The frontend is constructed with Vue2 and styled with CSS and Bootstrap, providing a user-friendly interface for interacting with the to-do items. The data is stored in an H2 database, and when offline, data is saved in the client's local storage and will be synchronized with the database when the connection is restored.

## Getting Started

To begin, import the project into your IDE and ensure you have Java and Maven installed on your system.

## Running the Application

1. Run the Spring Boot application from your IDE or by executing `mvn spring-boot:run` in the terminal.
2. Open your browser and navigate to http://localhost:8080. You should be redirected and see the login page of the To-Do App.
3. Log in to the system with one of the preset users:

- Admin User: admin (Password: admin)
- Regular User 1: user1 (Password: user1)

## Using the Application

- Each page can display a maximum of 5 items. Use the navigation bar at the bottom to navigate through the pages.
- To create a new To-Do item, enter the To-Do content into the "Enter new todo" text field and click "Create", or simply press "Enter".
- To edit or delete an item, click on the "Edit" or "Delete" button.
- After you have finished editing, press "Save" to save your changes, or "Cancel" to exit without saving.
- To toggle an item as pending or completed, click on the checkbox, and a visual cue will indicate the status.
- To toggle hiding all completed items, click the "Hide Completed" button on the top right. The completed items should then be hidden. Click again to show all items again.
- When the client fails to connect to the database, a warning will be shown at the top of the page. However, you can still continue working.
- Once the database is back online, your work will be synchronised, but please note that it is recommended that you make simple and minimal changes to avoid any loss of work.
- To logout, click the "Logout" button on the top right corner.

## Built With

- Spring Boot 2.7.10
- Vue2
- Maven
- H2 Database
- Bootstrap
