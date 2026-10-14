package com.gestao.uep.domain.canteiro;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "canteiros")
@Getter
@NoArgsConstructor
public class Canteiro {

    @Id
    @Column(length = 64)
    private String id;

    @Column(nullable = false, unique = true, length = 32)
    private String codigo;

    @Column(nullable = false)
    private String nome;

    public Canteiro(String id, String codigo, String nome) {
        this.id = id;
        this.codigo = codigo;
        this.nome = nome;
    }
}
