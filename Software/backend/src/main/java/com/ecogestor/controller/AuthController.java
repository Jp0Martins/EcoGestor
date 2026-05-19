package com.ecogestor.controller;

import com.ecogestor.model.Usuario;
import com.ecogestor.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = {"http://localhost:5500", "http://127.0.0.1:5500"})
public class AuthController {
    @Autowired
    private UsuarioRepository usuarioRepo;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> login) {
        String email = login.get("email");
        if(email == null) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Email é obrigatório"));
        }

        return usuarioRepo.findByEmail(email)
                .map(usuario -> ResponseEntity.ok(Map.of(
                    "id", usuario.getId(),
                    "nome", usuario.getNome(),
                    "email", usuario.getEmail(),
                    "empresa", Map.of(
                        "id", usuario.getEmpresa().getId(),
                        "nome", usuario.getEmpresa().getNome()
                    )
                )))
                .orElse(ResponseEntity.status(401).body(Map.of("erro", "Usuário não encontrado")));
    }
}