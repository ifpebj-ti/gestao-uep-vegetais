package com.gestao.uep.services;

/** Indica que um ID token do Google nao pode ser aceito. */
public class GoogleAuthenticationException extends RuntimeException {

    public GoogleAuthenticationException(String message) {
        super(message);
    }

    public GoogleAuthenticationException(String message, Throwable cause) {
        super(message, cause);
    }
}
