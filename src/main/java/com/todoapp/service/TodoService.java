package com.todoapp.service;

import com.todoapp.model.Todo;
import com.todoapp.model.User;
import com.todoapp.repository.TodoRepository;
import com.todoapp.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

// Pagination required, abandoned
// import org.springframework.data.domain.Page;
// import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

// Authed Todo Model/Service
@Service
public class TodoService {

    @Autowired
    private TodoRepository todoRepository;

    @Autowired
    private UserRepository userRepository;

    // Authed User Getter
    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        return userRepository.findByUsername(username);
    }

    // public Page<Todo> findAll(Pageable pageable) {
    //     User user = getAuthenticatedUser();
    //     return todoRepository.findByUser(user, pageable);
    // }

    public List<Todo> findAll() {
        User user = getAuthenticatedUser();
        return todoRepository.findByUser(user);
    }

    public Todo findById(Integer id) {
        Optional<Todo> optionalTodo = todoRepository.findById(id);
        if (optionalTodo.isPresent()) {
            return optionalTodo.get();
        } else {
            throw new RuntimeException("Todo not found");
        }
    }

    public Todo save(Todo todo) {
        User user = getAuthenticatedUser();
        todo.setUser(user);
        return todoRepository.save(todo);
    }

    public Todo update(Integer id, Todo todo) {
        Todo existingTodo = findById(id);
        existingTodo.setContent(todo.getContent());
        existingTodo.setStatus(todo.getStatus());
        return todoRepository.save(existingTodo);
    }

    public void delete(Integer id) {
        Todo todo = findById(id);
        todoRepository.delete(todo);
    }

    public Todo toggleStatus(Integer id) {
        Todo todo = findById(id);
        if (todo.getStatus() == Todo.TodoStatus.PENDING) {
            todo.setStatus(Todo.TodoStatus.COMPLETED);
        } else {
            todo.setStatus(Todo.TodoStatus.PENDING);
        }
        return todoRepository.save(todo);
    }
}
