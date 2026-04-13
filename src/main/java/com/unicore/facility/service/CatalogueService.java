package com.unicore.facility.service;

import com.unicore.facility.dto.CreateCatalogueRequest;
import com.unicore.facility.entity.Catalogue;
import com.unicore.facility.repository.CatalogueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CatalogueService {

    private final CatalogueRepository catalogueRepository;

    public List<Catalogue> getAllCatalogues() {
        return catalogueRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    public Catalogue createCatalogue(CreateCatalogueRequest request) {
        validateRequest(request);

        Catalogue catalogue = new Catalogue();
        catalogue.setName(request.getName().trim());
        catalogue.setType(request.getType().trim());
        catalogue.setCapacity(request.getCapacity());
        catalogue.setLocation(request.getLocation().trim());
        catalogue.setDescription(request.getDescription() == null ? "" : request.getDescription().trim());
        catalogue.setStatus(parseStatus(request.getStatus()));
        catalogue.setCreatedAt(Instant.now());

        return catalogueRepository.save(catalogue);
    }

    public Catalogue updateCatalogue(String id, CreateCatalogueRequest request) {
        validateRequest(request);

        Catalogue catalogue = catalogueRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Catalogue not found."));

        catalogue.setName(request.getName().trim());
        catalogue.setType(request.getType().trim());
        catalogue.setCapacity(request.getCapacity());
        catalogue.setLocation(request.getLocation().trim());
        catalogue.setDescription(request.getDescription() == null ? "" : request.getDescription().trim());
        catalogue.setStatus(parseStatus(request.getStatus()));

        return catalogueRepository.save(catalogue);
    }

    public void deleteCatalogue(String id) {
        if (!catalogueRepository.existsById(id)) {
            throw new RuntimeException("Catalogue not found.");
        }
        catalogueRepository.deleteById(id);
    }

    private void validateRequest(CreateCatalogueRequest request) {
        if (request == null) {
            throw new RuntimeException("Request body is required.");
        }
        if (isBlank(request.getName())) {
            throw new RuntimeException("Catalogue name is required.");
        }
        if (isBlank(request.getType())) {
            throw new RuntimeException("Type is required.");
        }
        if (request.getCapacity() == null || request.getCapacity() <= 0) {
            throw new RuntimeException("Capacity must be greater than 0.");
        }
        if (isBlank(request.getLocation())) {
            throw new RuntimeException("Location is required.");
        }
        if (isBlank(request.getStatus())) {
            throw new RuntimeException("Status is required.");
        }
    }

    private Catalogue.Status parseStatus(String value) {
        try {
            return Catalogue.Status.valueOf(value.trim().toUpperCase());
        } catch (Exception ex) {
            throw new RuntimeException("Invalid status. Allowed values: ACTIVE, OUT_OF_SERVICE");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
