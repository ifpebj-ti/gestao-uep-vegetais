package com.gestao.uep.services;

/** Dados confiaveis extraidos de um ID token validado pelo Google. */
public record GoogleIdentity(
        String subject,
        String email,
        String nome,
        String dominioHospedado
) {
}
