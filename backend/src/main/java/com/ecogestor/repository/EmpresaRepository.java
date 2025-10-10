package com.ecogestor.repository;

import com.ecogestor.model.Empresa;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface EmpresaRepository extends JpaRepository<Empresa, UUID> {}