'use client'

import { useEffect, useState } from "react";

// Custom hook koji implementira debouncing za vrednost
export function useDebounce<T>(value: T, delay: number = 500): T {
    // useState koristi se za praćenje debounced vrednosti
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    // useEffect se koristi da bi se vrednost kasnila (debounced)
    useEffect(() => {
        // Kreiramo timeout koji čeka 'delay' milisekundi pre nego što postavi novu debounced vrednost
        const handler = setTimeout(() => {
            setDebouncedValue(value); // Postavlja novu vrednost u debouncedValue nakon 'delay' vremena
        }, delay);

        // Čišćenje timeout-a kada se vrednost ili delay promene
        return () => clearTimeout(handler);
    }, [value, delay]); // useEffect zavisi od 'value' i 'delay', tako da se ponovo pokreće svaki put kada se jedna od njih promeni

    return debouncedValue; // Vraća debounced vrednost koja je ažurirana nakon određenog vremena
}
