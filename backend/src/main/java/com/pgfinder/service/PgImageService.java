package com.pgfinder.service;

import com.pgfinder.dto.ApiDtos.ImageDto;
import com.pgfinder.exception.ApiException;
import com.pgfinder.exception.NotFoundException;
import com.pgfinder.model.Pg;
import com.pgfinder.model.PgImage;
import com.pgfinder.repository.PgImageRepository;
import com.pgfinder.repository.PgRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.Set;
import java.util.Locale;
import java.util.UUID;

@Service
public class PgImageService {

    private static final long MAX_BYTES = 10 * 1024 * 1024;
    private static final Set<String> CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    private final PgImageRepository images;
    private final PgRepository pgs;
    private final Path uploadDirectory;

    public PgImageService(PgImageRepository images, PgRepository pgs,
                          @Value("${app.upload.dir:uploads}") String uploadDirectory) {
        this.images = images;
        this.pgs = pgs;
        this.uploadDirectory = Path.of(uploadDirectory).toAbsolutePath().normalize();
    }

    @Transactional
    public ImageDto upload(String ownerId, String pgId, MultipartFile file) {
        Pg pg = ownedPg(ownerId, pgId);
        if (file.isEmpty() || file.getSize() > MAX_BYTES) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Image must be non-empty and no larger than 10 MB");
        }
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!CONTENT_TYPES.contains(contentType)) {
            throw new ApiException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Only JPEG, PNG, and WebP images are supported");
        }
        byte[] content;
        try {
            content = file.getBytes();
        } catch (IOException e) {
            throw new IllegalStateException("Could not read uploaded image", e);
        }
        if (!hasImageSignature(contentType, content)) {
            throw new ApiException(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                    "The uploaded image content does not match its declared type");
        }
        String extension = switch (contentType) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> throw new ApiException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Unsupported image type");
        };
        String storageName = UUID.randomUUID() + extension;
        Path destination = uploadDirectory.resolve(storageName);
        try {
            Files.createDirectories(uploadDirectory);
            Files.write(destination, content, StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE);
        } catch (IOException e) {
            throw new IllegalStateException("Could not store uploaded image", e);
        }
        PgImage image = new PgImage();
        image.setId("image-" + UUID.randomUUID());
        image.setStorageName(storageName);
        image.setContentType(contentType);
        image.setPg(pg);
        try {
            image = images.save(image);
        } catch (RuntimeException e) {
            deleteStoredFile(destination);
            throw e;
        }
        return toDto(image);
    }

    @Transactional
    public void delete(String ownerId, String pgId, String imageId) {
        ownedPg(ownerId, pgId);
        PgImage image = images.findByIdAndPgId(imageId, pgId)
                .orElseThrow(() -> new NotFoundException("Image not found: " + imageId));
        Path file = uploadDirectory.resolve(image.getStorageName()).normalize();
        if (!file.getParent().equals(uploadDirectory)) {
            throw new IllegalStateException("Stored image path is outside the configured upload directory");
        }
        try {
            Files.deleteIfExists(file);
        } catch (IOException e) {
            throw new IllegalStateException("Could not remove stored image", e);
        }
        images.delete(image);
    }

    private Pg ownedPg(String ownerId, String pgId) {
        return pgs.findByIdAndOwnerId(pgId, ownerId)
                .orElseThrow(() -> new NotFoundException("PG not found: " + pgId));
    }

    private ImageDto toDto(PgImage image) {
        return new ImageDto(image.getId(), "/uploads/" + image.getStorageName(),
                image.getContentType(), image.getCreatedAt());
    }

    private static void deleteStoredFile(Path file) {
        try {
            Files.deleteIfExists(file);
        } catch (IOException e) {
            throw new IllegalStateException("Could not clean up uploaded image after database failure", e);
        }
    }

    private static boolean hasImageSignature(String contentType, byte[] bytes) {
        return switch (contentType) {
            case "image/jpeg" -> bytes.length >= 3
                    && (bytes[0] & 0xff) == 0xff && (bytes[1] & 0xff) == 0xd8 && (bytes[2] & 0xff) == 0xff;
            case "image/png" -> bytes.length >= 8
                    && (bytes[0] & 0xff) == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4e && bytes[3] == 0x47
                    && bytes[4] == 0x0d && bytes[5] == 0x0a && bytes[6] == 0x1a && bytes[7] == 0x0a;
            case "image/webp" -> bytes.length >= 12 && bytes[0] == 'R' && bytes[1] == 'I'
                    && bytes[2] == 'F' && bytes[3] == 'F' && bytes[8] == 'W' && bytes[9] == 'E'
                    && bytes[10] == 'B' && bytes[11] == 'P';
            default -> false;
        };
    }
}
