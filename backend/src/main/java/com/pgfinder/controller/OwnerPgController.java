package com.pgfinder.controller;

import com.pgfinder.dto.ApiDtos.BedWriteRequest;
import com.pgfinder.dto.ApiDtos.PgWriteRequest;
import com.pgfinder.dto.ApiDtos.RoomWriteRequest;
import com.pgfinder.dto.PgDtos.BedDto;
import com.pgfinder.dto.PgDtos.PgDetail;
import com.pgfinder.service.OwnerPgService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/owner/pgs")
@PreAuthorize("hasRole('OWNER')")
public class OwnerPgController {

    private final OwnerPgService ownerPgService;

    public OwnerPgController(OwnerPgService ownerPgService) {
        this.ownerPgService = ownerPgService;
    }

    @GetMapping
    public List<PgDetail> list(Authentication authentication) {
        return ownerPgService.listOwned(authentication.getName());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PgDetail create(Authentication authentication, @Valid @RequestBody PgWriteRequest request) {
        return ownerPgService.create(authentication.getName(), request);
    }

    @GetMapping("/{pgId}")
    public PgDetail get(Authentication authentication, @PathVariable String pgId) {
        return ownerPgService.getOwned(authentication.getName(), pgId);
    }

    @PutMapping("/{pgId}")
    public PgDetail update(Authentication authentication, @PathVariable String pgId,
                           @Valid @RequestBody PgWriteRequest request) {
        return ownerPgService.update(authentication.getName(), pgId, request);
    }

    @DeleteMapping("/{pgId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Authentication authentication, @PathVariable String pgId) {
        ownerPgService.delete(authentication.getName(), pgId);
    }

    @PostMapping("/{pgId}/rooms")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> addRoom(Authentication authentication, @PathVariable String pgId,
                                       @Valid @RequestBody RoomWriteRequest request) {
        return Map.of("id", ownerPgService.addRoom(authentication.getName(), pgId, request));
    }

    @PutMapping("/{pgId}/rooms/{roomId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateRoom(Authentication authentication, @PathVariable String pgId, @PathVariable String roomId,
                           @Valid @RequestBody RoomWriteRequest request) {
        ownerPgService.updateRoom(authentication.getName(), pgId, roomId, request);
    }

    @DeleteMapping("/{pgId}/rooms/{roomId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRoom(Authentication authentication, @PathVariable String pgId, @PathVariable String roomId) {
        ownerPgService.deleteRoom(authentication.getName(), pgId, roomId);
    }

    @PostMapping("/{pgId}/rooms/{roomId}/beds")
    @ResponseStatus(HttpStatus.CREATED)
    public BedDto addBed(Authentication authentication, @PathVariable String pgId, @PathVariable String roomId,
                         @Valid @RequestBody BedWriteRequest request) {
        return BedDto.from(ownerPgService.addBed(authentication.getName(), pgId, roomId, request));
    }

    @PutMapping("/{pgId}/rooms/{roomId}/beds/{bedId}")
    public BedDto updateBed(Authentication authentication, @PathVariable String pgId, @PathVariable String roomId,
                            @PathVariable Long bedId, @Valid @RequestBody BedWriteRequest request) {
        return BedDto.from(ownerPgService.updateBed(authentication.getName(), pgId, roomId, bedId, request));
    }

    @DeleteMapping("/{pgId}/rooms/{roomId}/beds/{bedId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteBed(Authentication authentication, @PathVariable String pgId, @PathVariable String roomId,
                          @PathVariable Long bedId) {
        ownerPgService.deleteBed(authentication.getName(), pgId, roomId, bedId);
    }
}
