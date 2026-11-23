package ept.edu.sn.alumni_backend.common.stockage;

import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/** Opérations sur les fichiers à faire seulement si la transaction en cours est validée (ou annulée). */
public final class ApresTransaction {
    private ApresTransaction() {
    }

    /** Après le commit ; tout de suite s'il n'y a pas de transaction. */
    public static void siValidee(Runnable action) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            action.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                action.run();
            }
        });
    }

    /** Après un rollback : le fichier écrit pour une transaction annulée ne doit pas rester sur le disque. */
    public static void siAnnulee(Runnable action) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int statut) {
                if (statut != STATUS_COMMITTED) {
                    action.run();
                }
            }
        });
    }
}
