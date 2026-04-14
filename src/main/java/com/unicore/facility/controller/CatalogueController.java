package com.unicore.facility.controller;

import com.unicore.facility.dto.CreateCatalogueRequest;
import com.unicore.facility.entity.Catalogue;
import com.unicore.facility.service.CatalogueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/catalogues")
@RequiredArgsConstructor
public class CatalogueController {

    private final CatalogueService catalogueService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','USER','TECHNICIAN')")
    public ResponseEntity<List<Catalogue>> getAllCatalogues() {
        return ResponseEntity.ok(catalogueService.getAllCatalogues());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Catalogue> createCatalogue(@RequestBody CreateCatalogueRequest request) {
        return ResponseEntity.ok(catalogueService.createCatalogue(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Catalogue> updateCatalogue(@PathVariable String id,
                                                     @RequestBody CreateCatalogueRequest request) {
        return ResponseEntity.ok(catalogueService.updateCatalogue(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteCatalogue(@PathVariable String id) {
        catalogueService.deleteCatalogue(id);
        return ResponseEntity.ok(Map.of("message", "Catalogue deleted successfully."));
    }
}
