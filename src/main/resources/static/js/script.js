const app = new Vue({
    el: '#app',
    data: {
        todos: [],
        newTodo: {
            content: ''
        },
        currentPage: 0,
        totalPages: 0,
        pageSize: 5,
        offline: false,
        syncRequired: false,
        serverCheckInterval: 5000,
        unsyncedTodos: [],
        editingTodo: null,
    },
    created() {
        this.fetchTodos();
        this.loadLocalTodos();
        this.checkServerStatus();
        setInterval(this.checkServerStatus, this.serverCheckInterval);
    },
    methods: {
        formatDate(dateString) {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                timeZoneName: 'short'
            }).format(date);
        },
        async fetchTodos(page) {
            if (page === undefined) {
                page = this.currentPage;
            }

            if (this.offline) {
                return;
            }

            try {
                const response = await axios.get(`/api/todos?page=${page}&size=${this.pageSize}`);
                this.todos = response.data.content;
                this.currentPage = response.data.number;
                this.totalPages = response.data.totalPages;

                this.saveLocalTodos();
            } catch (error) {
                console.error('Failed to fetch todos:', error);
                this.offline = true;
            }
        },
        async addTodo() {
            const timestamp = new Date().toISOString();
            const newTodo = {
                content: this.newTodo.content,
                status: 'PENDING',
                createdAt: timestamp,
                updatedAt: timestamp
            };

            if (this.offline) {
                this.todos.unshift(newTodo);
                this.saveLocalTodos();
                this.syncRequired = true;
                this.unsyncedTodos.push(newTodo);
            } else {
                try {
                    const response = await axios.post('/api/todos', newTodo);
                    this.todos.unshift(response.data);
                    this.saveLocalTodos();
                } catch (error) {
                    console.error('Failed to add todo:', error);
                    this.offline = true;
                }
            }

            this.newTodo.content = '';
        },
        editTodo(todo) {
            this.editingTodo = todo;
        },
        async updateTodo(todo) {
            todo.updatedAt = new Date().toISOString();
            this.saveLocalTodos();
            this.editingTodo = null;

            if (!this.offline) {
                try {
                    await axios.put(`/api/todos/${todo.id}`, todo);
                } catch (error) {
                    console.error('Failed to update todo:', error);
                    this.offline = true;
                }
            } else {
                this.syncRequired = true;
                this.unsyncedTodos.push(todo);
            }
        },
        logout() {
            // Redirect to the /logout endpoint
            window.location.href = '/logout';
        },
        async toggleStatus(todo) {
            todo.status = todo.status === 'PENDING' ? 'COMPLETED' : 'PENDING';
            todo.updatedAt = new Date().toISOString();

            this.saveLocalTodos();

            if (!this.offline) {
                try {
                    await axios.put(`/api/todos/${todo.id}`, todo);
                } catch (error) {
                    console.error('Failed to update todo status:', error);
                    this.offline = true;
                }
            } else {
                this.syncRequired = true;
                this.unsyncedTodos.push(todo);
            }
        },
        async deleteTodo(todo) {
            this.todos = this.todos.filter(t => t.id !== todo.id);

            this.saveLocalTodos();

            if (!this.offline) {
                try {
                    await axios.delete(`/api/todos/${todo.id}`);
                } catch (error) {
                    console.error('Failed to delete todo:', error);
                    this.offline = true;
                }
            } else {
                this.syncRequired = true;
                this.unsyncedTodos.push({ ...todo, deleted: true });
            }
        },
        saveLocalTodos() {
            localStorage.setItem('todos', JSON.stringify(this.todos));
        },
        loadLocalTodos() {
            const storedTodos = localStorage.getItem('todos');
            if (storedTodos) {
                this.todos = JSON.parse(storedTodos);
            }
        },
        async checkServerStatus() {
            try {
                await axios.get('/api/health');
                this.offline = false;

                if (this.syncRequired) {
                    await this.syncTodos();
                    this.syncRequired = false;
                }
            } catch (error) {
                this.offline = true;
            }
        },
        async syncTodos() {
            // Sync unsynced todos with the server
            for (const todo of this.unsyncedTodos) {
                try {
                    if (todo.deleted) {
                        await axios.delete(`/api/todos/${todo.id}`);
                    } else if (!todo.id) {
                        // Add new todo
                        const response = await axios.post('/api/todos', todo);
                        todo.id = response.data.id;
                    } else {
                        // Update existing todo
                        await axios.put(`/api/todos/${todo.id}`, todo);
                    }
                } catch (error) {
                    console.error('Failed to sync todo:', error);
                    this.offline = true;
                    return;
                }
            }

            // Clear unsynced todos
            this.unsyncedTodos = [];

            // Sync deleted todos
            const response = await axios.get('/api/todos?size=1000'); // Assuming all todos can be fetched with a large enough size value
            const serverTodos = response.data.content;

            for (const serverTodo of serverTodos) {
                if (!this.todos.find(t => t.id === serverTodo.id)) {
                    try {
                        await axios.delete(`/api/todos/${serverTodo.id}`);
                    } catch (error) {
                        console.error('Failed to sync deleted todo:', error);
                        this.offline = true;
                        return;
                    }
                }
            }

            this.saveLocalTodos();
        }
    }
});

