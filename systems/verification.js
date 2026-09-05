const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require("discord.js");

const CONFIG = {
    VERIFICATION_CHANNEL: "1540720296926122025",
    VERIFIED_ROLE: "1538146639703703562"
};

// Código temporal de cada usuario
const verificationCodes = new Map();

// Tiempo de expiración: 5 minutos
const CODE_EXPIRATION = 5 * 60 * 1000;

// Máximo de intentos
const MAX_ATTEMPTS = 3;

// ==========================================
// PANEL DE VERIFICACIÓN
// ==========================================

async function sendVerificationPanel(guild) {
    const channel = guild.channels.cache.get(
        CONFIG.VERIFICATION_CHANNEL
    );

    if (!channel) {
        console.log("❌ No se encontró el canal de verificación.");
        return;
    }

    const messages = await channel.messages.fetch({
        limit: 50
    }).catch(() => null);

    if (!messages) return;

    // Evitar paneles duplicados
    const exists = messages.some(
        message =>
            message.author.id === guild.client.user.id &&
            message.components?.some(row =>
                row.components?.some(
                    component =>
                        component.customId === "dica_verify_button"
                )
            )
    );

    if (exists) {
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle("🔐 VERIFICACIÓN")
        .setDescription(
            [
                "Bienvenido al sistema oficial de verificación de **DICA STUDIO**.",
                "",
                "📋 **Sigue estos pasos:**",
                "",
                "1. Haz clic en el botón **[✅ Verificar]**.",
                "2. Revisa el MD que te enviará DICA Guard.",
                "3. Introduce correctamente el código recibido.",
                "4. Si el código es correcto, recibirás automáticamente el rol de verificado.",
                "",
                "🔒 La verificación ayuda a proteger el servidor."
            ].join("\n")
        )
        .setFooter({
            text: "DICA Guard • DICA STUDIO"
        });

    const button = new ButtonBuilder()
        .setCustomId("dica_verify_button")
        .setLabel("Verificar")
        .setEmoji("✅")
        .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder()
        .addComponents(button);

    await channel.send({
        embeds: [embed],
        components: [row]
    });

    console.log("✅ Panel de verificación enviado.");
}

// ==========================================
// GENERAR CÓDIGO
// ==========================================

function generateCode() {
    return Math.floor(
        100000 + Math.random() * 900000
    ).toString();
}

// ==========================================
// INICIAR VERIFICACIÓN
// ==========================================

async function startVerification(interaction) {
    const userId = interaction.user.id;

    const code = generateCode();

    verificationCodes.set(userId, {
        code,
        expiresAt: Date.now() + CODE_EXPIRATION,
        attempts: 0
    });

    try {
        await interaction.user.send({
            embeds: [
                new EmbedBuilder()
                    .setTitle("🔐 Código de verificación")
                    .setDescription(
                        [
                            "Has solicitado verificar tu cuenta en **DICA STUDIO**.",
                            "",
                            `🔢 **Tu código:** \`${code}\``,
                            "",
                            "⏱️ Este código caduca en **5 minutos**.",
                            "⚠️ No compartas este código con otras personas."
                        ].join("\n")
                    )
                    .setFooter({
                        text: "DICA Guard"
                    })
            ]
        });

        await interaction.reply({
            content:
                "📩 Te envié un código de verificación por MD.\n" +
                "Cuando lo recibas, pulsa nuevamente **Verificar** para introducirlo.",
            ephemeral: true
        });

    } catch (error) {
        verificationCodes.delete(userId);

        await interaction.reply({
            content:
                "❌ No pude enviarte un MD.\n" +
                "Activa los mensajes directos de miembros del servidor e inténtalo nuevamente.",
            ephemeral: true
        });
    }
}

// ==========================================
// MOSTRAR MODAL
// ==========================================

async function showVerificationModal(interaction) {
    const modal = new ModalBuilder()
        .setCustomId("dica_verify_modal")
        .setTitle("🔐 Verificación DICA STUDIO");

    const input = new TextInputBuilder()
        .setCustomId("verification_code")
        .setLabel("Código recibido por MD")
        .setPlaceholder("Ejemplo: 123456")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMinLength(6)
        .setMaxLength(6);

    const row = new ActionRowBuilder()
        .addComponents(input);

    modal.addComponents(row);

    await interaction.showModal(modal);
}

// ==========================================
// COMPROBAR CÓDIGO
// ==========================================

async function verifyCode(interaction) {
    const userId = interaction.user.id;
    const enteredCode = interaction.fields
        .getTextInputValue("verification_code")
        .trim();

    const data = verificationCodes.get(userId);

    if (!data) {
        return interaction.reply({
            content:
                "❌ No tienes un código activo. Pulsa **Verificar** para solicitar uno.",
            ephemeral: true
        });
    }

    // Comprobar expiración
    if (Date.now() > data.expiresAt) {
        verificationCodes.delete(userId);

        return interaction.reply({
            content:
                "⏱️ Tu código ha expirado. Solicita uno nuevo.",
            ephemeral: true
        });
    }

    // Comprobar intentos
    data.attempts++;

    if (data.attempts > MAX_ATTEMPTS) {
        verificationCodes.delete(userId);

        return interaction.reply({
            content:
                "🚫 Has superado el número máximo de intentos. Solicita un nuevo código.",
            ephemeral: true
        });
    }

    // Código incorrecto
    if (enteredCode !== data.code) {
        return interaction.reply({
            content:
                `❌ Código incorrecto.\nIntento ${data.attempts}/${MAX_ATTEMPTS}.`,
            ephemeral: true
        });
    }

    // ======================================
    // CÓDIGO CORRECTO
    // ======================================

    const role = interaction.guild.roles.cache.get(
        CONFIG.VERIFIED_ROLE
    );

    if (!role) {
        return interaction.reply({
            content:
                "❌ No encontré el rol de verificado configurado.",
            ephemeral: true
        });
    }

    try {
        await interaction.member.roles.add(
            role,
            "Verificación DICA Guard"
        );

        verificationCodes.delete(userId);

        await interaction.reply({
            content:
                "✅ **¡Verificación completada!**\n" +
                `Has recibido el rol ${role}.`,
            ephemeral: true
        });

        // Aviso por MD
        await interaction.user.send({
            content:
                "✅ Tu cuenta ha sido verificada correctamente en **DICA STUDIO**."
        }).catch(() => {});

    } catch (error) {
        console.error(
            "Error asignando rol de verificación:",
            error
        );

        await interaction.reply({
            content:
                "❌ No pude asignarte el rol. Comprueba que DICA Guard tenga permisos suficientes.",
            ephemeral: true
        });
    }
}

// ==========================================
// EXPORTAR
// ==========================================

module.exports = {
    CONFIG,
    verificationCodes,

    sendVerificationPanel,
    startVerification,
    showVerificationModal,
    verifyCode
};
