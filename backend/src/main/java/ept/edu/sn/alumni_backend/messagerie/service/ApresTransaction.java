package ept.edu.sn.alumni_backend.messagerie.service;

import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/** Fichiers sur le disque : on ne les retire qu'une fois la transaction enregistrée (ou annulée, pour un nouveau). */
final class ApresTransaction {
    private ApresTransaction() {}

    static void siValidee(Runnable action) {
        enregistrer(action, true);
    }

    static void siAnnulee(Runnable action) {
        enregistrer(action, false);
    }

    private static void enregistrer(Runnable action, boolean validee) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int statut) {
                if ((statut == STATUS_COMMITTED) == validee) action.run();
            }
        });
    }
}
