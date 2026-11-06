import { createContext, useContext } from 'react'

// Bumped when a newer catalogue arrives (database refresh or an admin save in another tab).
// Pages that memoise product/post lists include it in their dependencies.
export const CatalogueVersion = createContext(0)
export const useCatalogueVersion = () => useContext(CatalogueVersion)
