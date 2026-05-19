package com.ecogestor.controller;

import com.ecogestor.model.Setor;
import com.ecogestor.model.Empresa;
import com.ecogestor.repository.SetorRepository;
import com.ecogestor.repository.EmpresaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/setores")
@CrossOrigin(origins = {"http://localhost:5500", "http://127.0.0.1:5500"})
public class SetorController {

    @Autowired
    private SetorRepository setorRepo;

    @Autowired
    private EmpresaRepository empresaRepo;

    // Listar setores (por empresa)
    @GetMapping
    public List<Setor> listarSetores(@RequestParam(required = false) UUID empresa_id) {
        if (empresa_id != null) {
            Optional<Empresa> empresaOpt = empresaRepo.findById(empresa_id);
            if (empresaOpt.isPresent()) {
                return setorRepo.findByEmpresa(empresaOpt.get());
            }
            return List.of();
        }
        return setorRepo.findAll();
    }

    // Criar setor
    @PostMapping
    public Setor criarSetor(@RequestBody Setor setor) {
        setor.setId(UUID.randomUUID());
        return setorRepo.save(setor);
    }

    // Atualizar setor
    @PutMapping("/{id}")
    public ResponseEntity<Setor> atualizarSetor(@PathVariable UUID id, @RequestBody Setor dados) {
        Optional<Setor> setorOpt = setorRepo.findById(id);
        if (setorOpt.isEmpty()) return ResponseEntity.notFound().build();
        Setor setor = setorOpt.get();
        setor.setNome(dados.getNome());
        setor.setDescricao(dados.getDescricao());
        setor.setEmpresa(dados.getEmpresa());
        setorRepo.save(setor);
        return ResponseEntity.ok(setor);
    }

    // Excluir setor
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluirSetor(@PathVariable UUID id) {
        if (!setorRepo.existsById(id)) return ResponseEntity.notFound().build();
        setorRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}