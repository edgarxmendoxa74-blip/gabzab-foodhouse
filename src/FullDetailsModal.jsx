import React, { useState, useEffect } from 'react'

export default function FullDetailsModal(props) {
    const { painting: item, isOpen, onClose, addToCart } = props

    const [selectedVariations, setSelectedVariations] = useState({}) // { [groupName]: option }
    const [selectedFlavor, setSelectedFlavor] = useState('')
    const [selectedAddOns, setSelectedAddOns] = useState([])
    const [quantity, setQuantity] = useState(1)

    // Reset state when modal opens with a new item
    useEffect(() => {
        if (isOpen && item) {
            setSelectedVariations({})
            setSelectedFlavor('')
            setSelectedAddOns([])
            setQuantity(1)
        }
    }, [isOpen, item])

    if (!isOpen || !item) return null

    // Helper to get array from JSONB or fallback to empty array
    const variationGroups = Array.isArray(item.variations) ? item.variations : []
    const flavors = Array.isArray(item.flavors) ? item.flavors : []
    const addons = Array.isArray(item.addons) ? item.addons : []


    const handleAddToCart = () => {
        let finalPrice = Number(item.price)
        let optionsSummary = []

        // Handle Grouped Variations price & name
        Object.keys(selectedVariations).forEach(groupName => {
            const opt = selectedVariations[groupName]
            if (opt) {
                finalPrice += Number(opt.price) || 0
                optionsSummary.push(`${groupName}: ${opt.name}`)
            }
        })

        // Handle Flavor
        if (selectedFlavor) {
            optionsSummary.push(selectedFlavor)
        }

        // Handle Add-ons
        if (selectedAddOns.length > 0) {
            const addOnsTotal = selectedAddOns.reduce((sum, addon) => sum + (Number(addon.price) || 0), 0)
            finalPrice += addOnsTotal
            optionsSummary.push(`+ ${selectedAddOns.map(a => a.name).join(', ')}`)
        }


        const customTitle = optionsSummary.length > 0
            ? `${item.name} [${optionsSummary.join(' | ')}]`
            : item.name

        // Generate a unique ID based on all selections
        const varPart = Object.keys(selectedVariations).sort().map(g => `${g}:${selectedVariations[g].name}`).join('-') || 'no_var'
        const customizedItem = {
            ...item,
            id: `${item.id}-${varPart}-${selectedFlavor || 'std'}-${(selectedAddOns.map(a => a.name).sort().join('_') || 'none')}`,
            customTitle: customTitle.trim(),
            price: finalPrice,
            quantity: quantity,
            customization: {
                variations: selectedVariations,
                flavor: selectedFlavor,
                addons: selectedAddOns
            }
        }

        addToCart(customizedItem)
        onClose()
    }

    const toggleAddOn = (addon) => {
        if (selectedAddOns.find(a => a.name === addon.name)) {
            setSelectedAddOns(selectedAddOns.filter(a => a.name !== addon.name))
        } else {
            setSelectedAddOns([...selectedAddOns, addon])
        }
    }

    const isAddDisabled = () => {
        // Required: Variation Groups (if marked as required)
        for (const group of variationGroups) {
            if (group.required && !selectedVariations[group.groupName]) {
                return true
            }
        }
        // Required: Flavors (if exist)
        if (flavors.length > 0 && !selectedFlavor) return true
        return false
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--c-slate)', border: '1px solid var(--border-light)', maxWidth: '500px' }}>
                <button className="modal-close" onClick={onClose} style={{ color: 'var(--c-gold)' }}>&times;</button>

                <div className="modal-body" style={{ display: 'block', padding: 0 }}>
                    <div className="modal-details" style={{ color: 'var(--text)', padding: '2rem' }}>
                        <h2 className="logo-branding" style={{ color: 'var(--c-gold)', fontSize: '2rem', marginBottom: '0.5rem' }}>{item.name}</h2>
                        <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{item.description}</p>

                        {/* Grouped Variations Section */}
                        {variationGroups.map((group, gIdx) => (
                            <div key={group.groupName || gIdx} className="modal-section" style={{ marginBottom: '1.5rem', borderLeft: group.required ? '3px solid var(--c-gold)' : '3px solid transparent', paddingLeft: '1rem' }}>
                                <p className="modal-label" style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>{group.groupName}</span>
                                    {group.required ? (
                                        <span style={{ fontSize: '0.7rem', color: 'var(--c-gold)', background: 'rgba(255,215,0,0.1)', padding: '2px 6px', borderRadius: '4px' }}>REQUIRED</span>
                                    ) : (
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>OPTIONAL</span>
                                    )}
                                </p>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {group.options.map(opt => (
                                        <button
                                            key={opt.name}
                                            className={`category-btn ${selectedVariations[group.groupName]?.name === opt.name ? 'active' : ''}`}
                                            onClick={() => {
                                                const newVars = { ...selectedVariations }
                                                if (newVars[group.groupName]?.name === opt.name && !group.required) {
                                                    delete newVars[group.groupName] // Allow deselect if not required
                                                } else {
                                                    newVars[group.groupName] = opt
                                                }
                                                setSelectedVariations(newVars)
                                            }}
                                            style={{ fontSize: '0.85rem' }}
                                        >
                                            {opt.name} {Number(opt.price) > 0 && `(+₱${Number(opt.price).toLocaleString()})`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Flavors Section */}
                        {flavors.length > 0 && (
                            <div className="modal-section" style={{ marginBottom: '1.5rem' }}>
                                <p className="modal-label" style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Select Flavor</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--c-gold)' }}>REQUIRED</span>
                                </p>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {flavors.map(f => (
                                        <button
                                            key={typeof f === 'string' ? f : f.name}
                                            className={`category-btn ${selectedFlavor === (typeof f === 'string' ? f : f.name) ? 'active' : ''}`}
                                            onClick={() => setSelectedFlavor(typeof f === 'string' ? f : f.name)}
                                            style={{ fontSize: '0.85rem' }}
                                        >
                                            {typeof f === 'string' ? f : f.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}


                        {/* Add-ons Section */}
                        {addons.length > 0 && (
                            <div className="modal-section" style={{ marginBottom: '1.5rem' }}>
                                <p className="modal-label" style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Add-ons (Optional)</p>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {addons.map(addon => (
                                        <button
                                            key={addon.name}
                                            className={`category-btn ${selectedAddOns.find(a => a.name === addon.name) ? 'active' : ''}`}
                                            onClick={() => toggleAddOn(addon)}
                                            style={{ fontSize: '0.85rem' }}
                                        >
                                            {addon.name} (+₱{Number(addon.price).toLocaleString()})
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Price Display */}
                        <div className="modal-section" style={{ marginBottom: '1.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p className="modal-label" style={{ marginBottom: '0.2rem' }}>Unit Price</p>
                                    <p style={{ color: 'var(--text-light)', fontSize: '1rem', fontWeight: '600', marginBottom: '0.3rem' }}>
                                        ₱{(
                                            Number(item.price) +
                                            Object.values(selectedVariations).reduce((sum, v) => sum + (Number(v.price) || 0), 0) +
                                            selectedAddOns.reduce((sum, a) => sum + (Number(a.price) || 0), 0)
                                        ).toLocaleString()}
                                    </p>
                                    <p className="modal-label" style={{ marginBottom: '0.2rem' }}>Total Price ({quantity} item{quantity > 1 ? 's' : ''})</p>
                                    <p style={{ color: 'var(--c-gold)', fontSize: '1.8rem', fontWeight: '800' }}>
                                        ₱{(
                                            (Number(item.price) +
                                                Object.values(selectedVariations).reduce((sum, v) => sum + (Number(v.price) || 0), 0) +
                                                selectedAddOns.reduce((sum, a) => sum + (Number(a.price) || 0), 0)) * quantity
                                        ).toLocaleString()}
                                    </p>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        style={{ background: 'white', border: '1px solid var(--border-light)', color: 'var(--text)', width: '35px', height: '35px', borderRadius: '4px', fontSize: '1rem' }}
                                    >-</button>
                                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        style={{ background: 'var(--c-gold)', border: 'none', color: 'var(--c-midnight)', width: '35px', height: '35px', borderRadius: '4px', fontSize: '1rem', fontWeight: 'bold' }}
                                    >+</button>

                                </div>
                            </div>
                        </div>

                        <button
                            className="btn-primary"
                            style={{ width: '100%', opacity: isAddDisabled() ? 0.6 : 1, cursor: isAddDisabled() ? 'not-allowed' : 'pointer' }}
                            onClick={handleAddToCart}
                            disabled={isAddDisabled()}
                        >
                            {isAddDisabled() ? 'Complete Selection' : 'Add to Order'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
