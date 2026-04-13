package com.unicore.facility.repository;

import com.unicore.facility.entity.Catalogue;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CatalogueRepository extends MongoRepository<Catalogue, String> {
}
