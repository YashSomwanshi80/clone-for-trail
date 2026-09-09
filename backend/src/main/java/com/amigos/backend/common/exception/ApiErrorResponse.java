// common/exception/ApiErrorResponse.java
package com.amigos.backend.common.exception;

import java.time.Instant;

public record ApiErrorResponse(Instant timestamp, int status, String message) {}
