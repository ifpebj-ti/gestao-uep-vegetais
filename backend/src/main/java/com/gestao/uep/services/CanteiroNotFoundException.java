package com.gestao.uep.services;

public class CanteiroNotFoundException extends RuntimeException {

    public CanteiroNotFoundException(String canteiroId) {
        super("Canteiro nao encontrado: " + canteiroId);
    }
}
