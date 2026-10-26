package com.pgfinder.exception;

/** Thrown when a requested record does not exist; returned to the client as HTTP 404. */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}
