package com.ecogestor.repository;

import com.ecogestor.model.Setor;
import com.ecogestor.model.Empresa;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface SetorRepository extends JpaRepository<Setor, UUID> {
    List<Setor> findByEmpresa(Empresa empresa);
}