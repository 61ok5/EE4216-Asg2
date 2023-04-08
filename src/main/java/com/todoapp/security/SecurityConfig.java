package com.todoapp.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

import static org.springframework.security.config.Customizer.withDefaults;

// Security Config
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Bean
    public AuthenticatedFilter alreadyAuthenticatedFilter() {
        return new AuthenticatedFilter(new AntPathRequestMatcher("/login"));
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .addFilterBefore(alreadyAuthenticatedFilter(), UsernamePasswordAuthenticationFilter.class)
                .authorizeHttpRequests(requests -> requests
                        .antMatchers("/h2-console/**").hasRole("ADMIN")
                        .anyRequest().authenticated())
                .formLogin(withDefaults())
                .csrf(csrf -> csrf.ignoringAntMatchers("/h2-console/**"))
                .csrf(csrf -> csrf.ignoringAntMatchers("/api/todos/**"))
                .headers(headers -> headers.frameOptions().sameOrigin());

        http.userDetailsService(userDetailsService);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
