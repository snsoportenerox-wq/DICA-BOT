const STAFF_ROLE = "1540815218689441812";

/**
 * Comprueba si un miembro tiene el rol Staff.
 */
function isStaff(member) {
    if (!member) return false;

    return member.roles?.cache?.has(STAFF_ROLE) || false;
}

/**
 * Comprueba si un miembro es Staff o Administrador.
 */
function isStaffOrAdmin(member) {
    if (!member) return false;

    if (isStaff(member)) {
        return true;
    }

    return member.permissions?.has("Administrator") || false;
}

/**
 * Comprueba si un miembro tiene un permiso específico.
 */
function hasPermission(member, permission) {
    if (!member || !permission) {
        return false;
    }

    return member.permissions?.has(permission) || false;
}

/**
 * Comprueba si el usuario puede administrar el servidor.
 */
function canManageServer(member) {
    if (!member) return false;

    return (
        isStaff(member) ||
        member.permissions?.has("Administrator") ||
        false
    );
}

/**
 * Comprueba si puede moderar a otro miembro.
 *
 * También respeta la jerarquía de roles de Discord.
 */
function canModerate(executor, target) {
    if (!executor || !target) {
        return false;
    }

    // Nadie puede moderarse a sí mismo
    if (executor.id === target.id) {
        return false;
    }

    // Administrador
    if (executor.permissions?.has("Administrator")) {
        return true;
    }

    // Staff
    if (!isStaff(executor)) {
        return false;
    }

    // El objetivo no puede ser el propietario
    if (target.id === target.guild?.ownerId) {
        return false;
    }

    // Jerarquía de Discord
    if (
        executor.roles?.highest &&
        target.roles?.highest
    ) {
        if (
            executor.roles.highest.position <=
            target.roles.highest.position
        ) {
            return false;
        }
    }

    return true;
}

/**
 * Comprueba si el bot puede moderar al miembro.
 */
function botCanModerate(guild, target) {
    if (!guild || !target) {
        return false;
    }

    const botMember = guild.members.me;

    if (!botMember) {
        return false;
    }

    // El propietario del servidor no puede ser moderado
    if (target.id === guild.ownerId) {
        return false;
    }

    // El bot no puede moderarse a sí mismo
    if (target.id === botMember.id) {
        return false;
    }

    // Jerarquía de Discord
    if (
        botMember.roles.highest.position <=
        target.roles.highest.position
    ) {
        return false;
    }

    return true;
}

/**
 * Comprueba si el usuario puede gestionar un ticket.
 */
function canManageTicket(member) {
    return isStaff(member);
}

/**
 * Comprueba si el usuario puede cerrar un ticket.
 */
function canCloseTicket(member) {
    return isStaff(member);
}

/**
 * Comprueba si el usuario puede añadir personas a un ticket.
 */
function canAddToTicket(member) {
    return isStaff(member);
}

/**
 * Comprueba si el usuario puede reclamar un ticket.
 */
function canClaimTicket(member) {
    return isStaff(member);
}

/**
 * Comprueba si el usuario puede liberar un ticket.
 */
function canReleaseTicket(member, claimedBy) {
    if (!isStaff(member)) {
        return false;
    }

    if (!claimedBy) {
        return false;
    }

    return member.id === claimedBy;
}

/**
 * Comprueba si el usuario es el propietario del ticket.
 */
function isTicketOwner(member, ticket) {
    if (!member || !ticket) {
        return false;
    }

    return member.id === ticket.userId;
}

module.exports = {
    STAFF_ROLE,
    isStaff,
    isStaffOrAdmin,
    hasPermission,
    canManageServer,
    canModerate,
    botCanModerate,
    canManageTicket,
    canCloseTicket,
    canAddToTicket,
    canClaimTicket,
    canReleaseTicket,
    isTicketOwner
};
