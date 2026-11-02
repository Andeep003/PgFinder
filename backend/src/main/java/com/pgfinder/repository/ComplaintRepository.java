package com.pgfinder.repository;

import com.pgfinder.model.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, String> {

    List<Complaint> findByAuthorIdOrderByCreatedAtDesc(String authorId);

    List<Complaint> findByPgOwnerIdOrderByCreatedAtDesc(String ownerId);
}
