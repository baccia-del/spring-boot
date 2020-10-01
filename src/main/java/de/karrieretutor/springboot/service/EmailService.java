package de.karrieretutor.springboot.service;

import de.karrieretutor.springboot.domain.BestelltesProdukt;
import de.karrieretutor.springboot.domain.Bestellung;
import de.karrieretutor.springboot.domain.Kunde;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring5.SpringTemplateEngine;

import javax.mail.MessagingException;
import javax.mail.internet.MimeMessage;
import java.util.Locale;

@Service
public class EmailService {
    Logger LOG = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    JavaMailSenderImpl mailSender;

    @Autowired
    SpringTemplateEngine templateEngine;

    @Autowired
    MessageSource messageSource;

    public void sendMessageWithAttachment(String to, String subject, String text) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
        helper.setFrom("noreply@gmail.com");
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(text, true); // true = isHtml
        mailSender.send(message);
    }

    public void versandHTML(Bestellung bestellung) {
        Locale locale;
        Kunde kunde = bestellung.getKunde();
        String sprache = kunde.getSprache();
        if (sprache == null) {
            locale = Locale.GERMAN;
            sprache = locale.getLanguage();
        } else {
            locale = new Locale(sprache);
        }
        String empfaenger = kunde.getEmail();
        String betreff = messageSource.getMessage("email.subject",
                new Object[]{ bestellung.getId(), bestellung.getGesamtzahl() }, locale);

        final Context ctx = new Context(locale);
        ctx.setVariable("bestellung", bestellung);
        ctx.setVariable("kunde", kunde);
        final String htmlContent = this.templateEngine.process(sprache + "/versand.html", ctx);

        try {
            sendMessageWithAttachment(empfaenger, betreff, htmlContent);
        } catch (MessagingException e) {
            LOG.error(e.getMessage(), e.getStackTrace());
        }
    }

    public void versandBestaetigung(Bestellung bestellung) {
        Kunde kunde = bestellung.getKunde();
        String empfaenger = kunde.getEmail();
        String betreff = "[Demo-Shop] Versandbestätigung für Ihre Bestellung Nr. " + bestellung.getId()
                + " von " + bestellung.getGesamtzahl() + " Artikeln";

        StringBuilder b = new StringBuilder(1000);
        b.append("<p>Hallo ").append(kunde.getNameFormatiert()).append(",<br/><br/>");
        b.append("Ihre Bestellung Nr.").append(bestellung.getId()).append(" wurde versendet.</p>");

        b.append("<p>Die Lieferung enthält folgende Artikel:<br/>");
        for (BestelltesProdukt bp : bestellung.getProdukte()) {
            b.append("Bezeichnung: ").append(bp.getProdukt().getName())
                    .append(", Preis: ").append(bp.getProdukt().getPreisFormatiert())
                    .append(", Anzahl: ").append(bp.getAnzahl() + "<br/>");
        }
        b.append("Gesamtzahl bestellter Produkte: ").append(bestellung.getGesamtzahl())
                .append(", Gesamtpreis: ").append(bestellung.getGesamtpreis() + "<br/>");
        b.append("</p>");

        b.append("<p>Es kann keine Änderung mehr an Ihrer Bestellung vorgenommen werden, da sie sich bereits im Versand befindet</p>");

        b.append("<p>Ihre Bestellung sollte in den nächsten 3 Werktage bei Ihnen ankommen.<br/>");
        b.append("Versendet wurde an folgende Adresse:<br/>");
        b.append(kunde.getNameFormatiert() + "<br/>");
        b.append(kunde.getStrasse() + "<br/>");
        b.append(kunde.getPlz() + " ").append(kunde.getOrt() + "</p>");

        b.append("<p>Zahlungsart:<br/>");
        b.append(kunde.getZahlungsart());
        b.append("</p>");

        b.append("Mit freundlichen Grüßen,<br/>");
        b.append("Ihr Demo-Shop-Team");

        try {
            sendMessageWithAttachment(empfaenger, betreff, b.toString());
        } catch (MessagingException e) {
            LOG.error(e.getMessage(), e.getStackTrace());
        }
    }
}
