package com.gestao.uep.controllers;

import com.gestao.uep.services.CanteiroNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> acessoNegado(AccessDeniedException exception) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("erro", exception.getMessage()));
    }

    @ExceptionHandler(CanteiroNotFoundException.class)
    public ResponseEntity<Map<String, String>> canteiroNaoEncontrado(CanteiroNotFoundException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("erro", exception.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> argumentoInvalido(IllegalArgumentException exception) {
        return ResponseEntity.badRequest()
                .body(Map.of("erro", exception.getMessage()));
    }
}
