package com.ecogestor.model;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "empresas")
public class Empresa {
    @Id
    private UUID id;

    private String nome;

    // Getters e setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
}