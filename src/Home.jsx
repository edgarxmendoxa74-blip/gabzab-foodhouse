import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import logo from './assets/logo_brand.jpg'
import heroImg from './assets/hero.jpg'
import FullDetailsModal from './FullDetailsModal'

function Home() {
    const [menuItems, setMenuItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [cart, setCart] = useState([])
    const [isCartOpen, setIsCartOpen] = useState(false)
    const [filter, setFilter] = useState('All')
    const [checkoutStep, setCheckoutStep] = useState('cart') // cart, shipping, success
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedItem, setSelectedItem] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        fetchMenuItems()
    }, [])

    const fetchMenuItems = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('menu_items')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setMenuItems(data || [])
        } catch (err) {
            console.error('Error fetching menu items:', err.message)
            setError('Failed to load menu. Please try again later.')
        } finally {
            setLoading(false)
        }
    }

    const addToCart = (item) => {
        if (!cart.find(cartItem => cartItem.id === item.id)) {
            setCart([...cart, item])
            setIsCartOpen(true)
        }
    }

    const removeFromCart = (id) => {
        setCart(cart.filter(item => item.id !== id))
    }

    const handleCheckout = async (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        const orderData = {
            full_name: formData.get('fullName'),
            email: formData.get('email'),
            shipping_address: formData.get('address'),
            total_amount: cartTotal,
            items: cart,
            status: 'pending'
        }

        try {
            setIsSubmitting(true)
            const { error } = await supabase
                .from('orders')
                .insert([orderData])

            if (error) throw error

            setCheckoutStep('success')
            setCart([])
        } catch (err) {
            alert('Error processing order: ' + err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const filteredItems = menuItems.filter(p => {
        const matchesCategory = filter === 'All' || p.category === filter
        return matchesCategory
    })

    const cartTotal = cart.reduce((sum, item) => sum + item.price, 0)

    return (
        <div className="home">
            {/* Top Banner */}
            <div className="top-banner">
                📍 Purok Adelfa, Poblacion North, San Fernando, Philippines | 📞 0936 908 7295 | 🕒 4PM - 12AM
            </div>

            {/* Navbar */}
            <nav className="navbar">
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <img src={logo} alt="The Midnight Canteen Logo" style={{ height: '70px', width: '70px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }} />
                        <span className="logo-branding">The Midnight Canteen</span>
                    </div>
                    <button className="cart-icon" onClick={() => { setIsCartOpen(true); setCheckoutStep('cart') }}>
                        🛒 <span className="cart-count">{cart.length}</span>
                    </button>
                </div>
            </nav>
            <div className="sub-header" style={{ position: 'sticky', top: '90px', zIndex: 999, backgroundColor: 'var(--glass-midnight)', padding: '1rem 0', borderBottom: '1px solid var(--border-light)', backdropFilter: 'blur(10px)' }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    {['All', 'Wings Series', 'Silog Series', 'Refreshers', 'Platters'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => {
                                setFilter(cat);
                                document.getElementById('menu').scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            className={`category-btn ${filter === cat ? 'active' : ''}`}
                            style={{ fontSize: '0.9rem', padding: '0.5rem 1.5rem' }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>


            {/* Menu Section */}
            <section className="gallery-section" id="menu">
                <div className="container">
                    <div className="section-title" style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 className="logo-branding" style={{ fontSize: '3.5rem', marginBottom: '1rem', display: 'block' }}>Our Menu</h2>
                        <p style={{ fontFamily: 'Alfa Slab One, serif', fontSize: '1.2rem', color: 'var(--c-gold)', letterSpacing: '1px', textShadow: '2px 2px 0px #000' }}>
                            CRAVE FULFILLED, RIGHT AT YOUR DOORSTEP! 🍴👋
                        </p>
                        <p style={{ color: 'var(--text-light)', fontSize: '1.1rem', marginTop: '0.8rem', fontWeight: '500' }}>
                            Book your orders now and satisfy your cravings! 📦
                        </p>
                    </div>


                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '5rem' }}>
                            <div className="loader">Preparing Delicious Food...</div>
                        </div>
                    ) : error ? (
                        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--c-gold)' }}>
                            <p>{error}</p>
                            <button onClick={fetchMenuItems} style={{ marginTop: '1rem', textDecoration: 'underline' }}>Try Again</button>
                        </div>
                    ) : (
                        <>
                            <div className="gallery-grid">
                                {filteredItems.map(item => (
                                    <div key={item.id} className="painting-card">
                                        <div className="painting-image-container">
                                            <img src={item.image} alt={item.title} className="painting-image" />
                                        </div>
                                        <div className="painting-info">
                                            <h3 className="painting-title">{item.title}</h3>
                                            <p className="item-description-short">{item.description || 'Deliciously prepared with our signature recipe.'}</p>
                                            <p className="painting-price">₱{Number(item.price).toLocaleString()}</p>
                                            <button
                                                className="btn-view-details"
                                                onClick={() => {
                                                    setSelectedItem(item)
                                                    setIsModalOpen(true)
                                                }}
                                                style={{ marginTop: '1rem', background: 'var(--c-gold)', color: 'var(--c-midnight)', fontWeight: '700', border: 'none' }}
                                            >
                                                Customize
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer style={{ padding: '2rem 0', backgroundColor: '#0a0a0c', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="container" style={{ textAlign: 'center' }}>
                </div>
            </footer>

            {/* Cart Panel Shell */}
            <div className={`cart-panel ${isCartOpen ? 'open' : ''}`}>
                <div className="cart-header">
                    <h3>{checkoutStep === 'cart' ? 'Your Order' : checkoutStep === 'shipping' ? 'Delivery Details' : 'Order Complete'}</h3>
                    <button onClick={() => setIsCartOpen(false)} style={{ fontSize: '1.5rem' }}>&times;</button>
                </div>

                {checkoutStep === 'cart' && (
                    <>
                        <div className="cart-items">
                            {cart.length === 0 ? (
                                <p style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-light)' }}>Your order list is empty.</p>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="cart-item">
                                        <img src={item.image} alt={item.title} className="cart-item-img" />
                                        <div className="cart-item-details">
                                            <h4>{item.customTitle || item.title}</h4>
                                            <p>₱{Number(item.price).toLocaleString()}</p>
                                            <button onClick={() => removeFromCart(item.id)} style={{ color: 'var(--c-gold)', fontSize: '0.8rem', marginTop: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Remove</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        {cart.length > 0 && (
                            <div className="cart-footer">
                                <div className="cart-total">
                                    <span>Total</span>
                                    <span>₱{cartTotal.toLocaleString()}</span>
                                </div>
                                <button className="btn-primary" style={{ width: '100%' }} onClick={() => setCheckoutStep('shipping')}>Proceed to Checkout</button>
                            </div>
                        )}
                    </>
                )}

                {checkoutStep === 'shipping' && (
                    <div className="cart-items">
                        <form className="checkout-form" onSubmit={handleCheckout}>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input name="fullName" type="text" required placeholder="John Doe" />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input name="email" type="email" required placeholder="john@example.com" />
                            </div>
                            <div className="form-group">
                                <label>Delivery Address</label>
                                <input name="address" type="text" required placeholder="Street, City, Province" />
                            </div>
                            <div className="cart-total" style={{ marginTop: '2rem' }}>
                                <span>Total Due</span>
                                <span>₱{cartTotal.toLocaleString()}</span>
                            </div>
                            <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                                {isSubmitting ? 'Processing...' : 'Place Order'}
                            </button>
                            <button type="button" onClick={() => setCheckoutStep('cart')} style={{ marginTop: '1rem', color: 'var(--text-light)' }}>Back to Cart</button>
                        </form>
                    </div>
                )}

                {checkoutStep === 'success' && (
                    <div style={{ textAlign: 'center', marginTop: '5rem' }}>
                        <div style={{ fontSize: '3rem', color: 'var(--accent)', marginBottom: '1rem' }}>🍔</div>
                        <h2>Order Confirmed</h2>
                        <p style={{ color: 'var(--text-light)', marginTop: '1rem' }}>Your order is being prepared. We'll notify you when it's out for delivery.</p>
                        <button className="btn-primary" style={{ marginTop: '2rem', width: '100%' }} onClick={() => setIsCartOpen(false)}>Order More</button>
                    </div>
                )}
            </div>

            {/* Overlay for Cart */}
            {isCartOpen && (
                <div
                    onClick={() => setIsCartOpen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 1999,
                    }}
                ></div>
            )}

            {/* Full Details Modal */}
            <FullDetailsModal
                painting={selectedItem}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                addToCart={addToCart}
            />
        </div>
    )
}

export default Home
