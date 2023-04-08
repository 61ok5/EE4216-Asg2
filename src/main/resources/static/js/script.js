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
        localTodos: [],
        editingTodo: null,
        showCompleted: true,
    },
    created() {
        (async () => {
            await this.checkServerStatus();
            this.loadTodos();
            console.log(this.todos);
            setInterval(this.checkServerStatus, this.serverCheckInterval);
        })();
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
        async loadTodos(page) {
            if (page === undefined) {
                page = this.currentPage;
            }

            if (this.offline) {
                this.loadLocalTodos();
            } else {
                const response = await axios.get('/api/todos');
                this.localTodos = response.data;
                localStorage.setItem('todos', JSON.stringify(this.localTodos));
            }

            if (!this.showCompleted) {
                this.localTodos = this.localTodos.filter(todo => todo.status === 'PENDING');
            }

            this.localTodos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            this.totalPages = Math.ceil((this.localTodos.length + 1) / this.pageSize);
            this.todos = this.localTodos.slice(page * this.pageSize, (page + 1) * this.pageSize);
            this.currentPage = page;
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
                newTodo.tempId = -Date.now()
                this.localTodos.unshift(newTodo);
                this.syncRequired = true;
                this.unsyncedTodos.push({ action: 'create', todo: newTodo });
            } else {
                const response = await axios.post('/api/todos', newTodo);
                newTodo.id = response.data.id;
                this.localTodos.unshift(newTodo);
            }

            localStorage.setItem('todos', JSON.stringify(this.localTodos));
            this.newTodo.content = '';
            this.loadTodos(this.currentPage);
        },
        startEditing(todo) {
            this.editingTodo = todo;
        },
        async updateTodo(todo) {
            todo.updatedAt = new Date().toISOString();

            if (!this.offline) {
                await axios.put(`/api/todos/${todo.id}`, todo);
            }

            const index = this.localTodos.findIndex(t => (this.offline && todo.tempId) ? t.tempId === todo.tempId : t.id === todo.id);
            if (index !== -1) {
                this.localTodos[index] = todo;
                this.syncRequired = true;
                this.unsyncedTodos.push({ action: 'update', todo });
            }

            localStorage.setItem('todos', JSON.stringify(this.localTodos));
            this.editingTodo = null;
            this.loadTodos(this.currentPage);
        },
        logout() {
            window.location.href = '/logout';
        },
        async toggleStatus(todo) {
            todo.status = todo.status === 'PENDING' ? 'COMPLETED' : 'PENDING';
            todo.updatedAt = new Date().toISOString();

            if (!this.offline) {
                await axios.put(`/api/todos/${todo.id}`, todo);
            }

            const index = this.localTodos.findIndex(t => (this.offline && todo.tempId) ? t.tempId === todo.tempId : t.id === todo.id);
            if (index !== -1) {
                this.localTodos[index] = todo;
                this.syncRequired = true;
                this.unsyncedTodos.push({ action: 'update', todo });
            }

            localStorage.setItem('todos', JSON.stringify(this.localTodos));
            this.loadTodos(this.currentPage);
        },
        async deleteTodo(todo) {
            if (!this.offline) {
                await axios.delete(`/api/todos/${todo.id}`);
            }

            this.localTodos = this.localTodos.filter(t => (this.offline && todo.tempId) ? t.tempId !== todo.tempId : t.id !== todo.id);
            this.syncRequired = true;
            this.unsyncedTodos.push({ action: 'delete', todo });

            localStorage.setItem('todos', JSON.stringify(this.localTodos));
            this.loadTodos(this.currentPage);
        },
        toggleCompletedVisibility() {
            this.showCompleted = !this.showCompleted;
            this.loadTodos(this.currentPage);
        },
        saveLocalTodos() {
            const allTodos = this.todos;
            const nonDeletedTodos = allTodos.filter(todo => !todo.deleted);
            nonDeletedTodos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            localStorage.setItem('todos', JSON.stringify(nonDeletedTodos));
        },

        loadLocalTodos() {
            const storedTodos = localStorage.getItem('todos');
            if (storedTodos) {
                this.localTodos = JSON.parse(storedTodos);
                this.totalPages = Math.ceil((this.localTodos.length + 1) / this.pageSize);
            }
        },
        async checkServerStatus() {
            try {
                const response = await axios.get("/api/health");
                if (response.status === 200 && response.data === "Server is online") {
                    if (this.offline) {
                        this.offline = false;
                        if (this.syncRequired) {
                            await this.syncTodos();
                            this.syncRequired = false;
                        }
                    }
                } else {
                    this.offline = true;
                }
            } catch (error) {
                this.offline = true;
            }
        },
        async syncTodos() {
            // Sync unsynced todos when back to online, with a mapping of tempId to actual id
            const idMapping = {};

            for (const { action, todo } of this.unsyncedTodos) {
                try {
                    const todostring = JSON.stringify(todo)
                    console.log(`Action: ${action}, Payload: ${todostring}`, idMapping);
                    if (action === 'delete') {
                        const idToDelete = todo.tempId ? idMapping[todo.tempId] : todo.id;
                        await axios.delete(`/api/todos/${idToDelete}`);
                        this.localTodos = this.localTodos.filter(t => t.id !== idToDelete);
                    } else if (action === 'create') {
                        const response = await axios.post('/api/todos', todo);
                        const newId = response.data.id;
                        idMapping[todo.tempId] = newId;
                        const index = this.localTodos.findIndex(t => t.tempId === todo.tempId);
                        if (index !== -1) {
                            this.localTodos[index].id = newId;
                            delete this.localTodos[index].tempId;
                            todo.id = newId;
                            delete todo.tempId;
                        }
                    } else if (action === 'update') {
                        const idToUpdate = todo.tempId ? idMapping[todo.tempId] : todo.id;
                        await axios.put(`/api/todos/${idToUpdate}`, todo);
                        const index = this.localTodos.findIndex(t => t.id === idToUpdate);
                        if (index !== -1) {
                            this.localTodos.splice(index, 1, todo);
                        }
                    }
                } catch (error) {
                    console.error('Failed to sync todo:', error);
                    this.offline = true;
                    return;
                }
            }

            // Clear unsynced todos
            this.unsyncedTodos = [];

            // Fetch todos from the server after syncing
            await this.loadTodos();
        },
    },
    computed: {
        paginationArray() {
            return Array.from({ length: this.totalPages }, (_, i) => i + 1);
        },
    },
});

