document.addEventListener('DOMContentLoaded', () => {
    // Hero Slider
    let currentSlideIndex = 0;
    const slides = document.querySelectorAll('.slide');

    if (slides.length > 0) {
        const moveSlide = (n) => {
            slides[currentSlideIndex].classList.remove('active');
            currentSlideIndex = (currentSlideIndex + n + slides.length) % slides.length;
            slides[currentSlideIndex].classList.add('active');
        };

        document.querySelector('.arrow.prev').addEventListener('click', () => moveSlide(-1));
        document.querySelector('.arrow.next').addEventListener('click', () => moveSlide(1));

        setInterval(() => moveSlide(1), 6000);
    }

    // Form: Toggle phone number field
    const togglePhone = (show) => {
        document.getElementById('phoneBox').style.display = show ? 'block' : 'none';
    };

    document.querySelectorAll('input[name="method"]').forEach(radio => {
        radio.addEventListener('change', (e) => togglePhone(e.target.value === 'phone'));
    });
});