package com.todoapp.repository;

import com.todoapp.model.Todo;
import org.springframework.data.jpa.repository.JpaRepository;

import com.todoapp.model.User;

import java.util.List;

// Pagination required, abandoned
// import org.springframework.data.domain.Page;
// import org.springframework.data.domain.Pageable;

public interface TodoRepository extends JpaRepository<Todo, Integer> {
    // Page<Todo> findByUser(User user, Pageable pageable);
    List<Todo> findByUser(User user);
}
