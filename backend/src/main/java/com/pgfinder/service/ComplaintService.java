package com.pgfinder.service;

import com.pgfinder.dto.ApiDtos.ComplaintCreateRequest;
import com.pgfinder.dto.ApiDtos.ComplaintDto;
import com.pgfinder.dto.ApiDtos.ComplaintUpdateRequest;
import com.pgfinder.exception.ApiException;
import com.pgfinder.exception.NotFoundException;
import com.pgfinder.model.Complaint;
import com.pgfinder.model.Pg;
import com.pgfinder.model.UserAccount;
import com.pgfinder.repository.ComplaintRepository;
import com.pgfinder.repository.PgRepository;
import com.pgfinder.repository.UserAccountRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class ComplaintService {

    private final ComplaintRepository complaints;
    private final PgRepository pgs;
    private final UserAccountRepository users;

    public ComplaintService(ComplaintRepository complaints, PgRepository pgs, UserAccountRepository users) {
        this.complaints = complaints;
        this.pgs = pgs;
        this.users = users;
    }

    @Transactional
    public ComplaintDto create(String authorId, ComplaintCreateRequest request) {
        Pg pg = pgs.findById(request.pgId())
                .orElseThrow(() -> new NotFoundException("PG not found: " + request.pgId()));
        UserAccount author = users.findById(authorId)
                .orElseThrow(() -> new NotFoundException("User not found: " + authorId));
        Complaint complaint = new Complaint();
        complaint.setId("complaint-" + UUID.randomUUID());
        complaint.setPg(pg);
        complaint.setAuthor(author);
        complaint.setSubject(request.subject().trim());
        complaint.setDescription(request.description().trim());
        return ComplaintDto.from(complaints.save(complaint));
    }

    @Transactional(readOnly = true)
    public List<ComplaintDto> myComplaints(String authorId) {
        return complaints.findByAuthorIdOrderByCreatedAtDesc(authorId).stream().map(ComplaintDto::from).toList();
    }

    @Transactional(readOnly = true)
    public List<ComplaintDto> ownerComplaints(String ownerId, boolean admin) {
        List<Complaint> result = admin ? complaints.findAll()
                : complaints.findByPgOwnerIdOrderByCreatedAtDesc(ownerId);
        return result.stream().map(ComplaintDto::from).toList();
    }

    @Transactional
    public ComplaintDto update(String complaintId, String actorId, boolean admin,
                              ComplaintUpdateRequest request) {
        Complaint complaint = complaints.findById(complaintId)
                .orElseThrow(() -> new NotFoundException("Complaint not found: " + complaintId));
        if (!admin && !complaint.getPg().getOwnerId().equals(actorId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You cannot update this complaint");
        }
        String status = request.status().trim().toLowerCase(Locale.ROOT);
        if (!List.of("open", "in_progress", "resolved", "rejected").contains(status)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Complaint status must be open, in_progress, resolved, or rejected");
        }
        complaint.setStatus(status);
        complaint.setResponse(request.response() == null ? null : request.response().trim());
        complaint.setUpdatedAt(Instant.now());
        return ComplaintDto.from(complaint);
    }
}
