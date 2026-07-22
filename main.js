document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.gallery-grid');
    const backToTopButton = document.getElementById('back-to-top');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1 // Trigger when 10% of the element is visible
    });

    animatedElements.forEach(element => {
        observer.observe(element);
    });

    // Show/hide "Back to Top" button
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopButton.classList.add('visible');
        } else {
            backToTopButton.classList.remove('visible');
        }
    });

    // Smooth scroll to top
    backToTopButton.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Preloader
    window.addEventListener('load', () => {
        const minimumTime = 1000; // Minimum display time in milliseconds (e.g., 2000ms = 2s)
        const preloader = document.querySelector('.preloader'); 

        // Set a timeout to hide the preloader after the minimum time
        setTimeout(() => {
            preloader.classList.add('hidden');
        }, minimumTime);
    });

    // Image Gallery Carousel & Modal
    const galleryContainer = document.querySelector('.gallery-grid');
    const galleryItems = document.querySelectorAll('.gallery-item');
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-image');
    const modalClose = document.querySelector('.modal-close');
    const prevButton = document.querySelector('.prev');
    const nextButton = document.querySelector('.next');
    let currentIndex = 0;
    let autoSwapInterval;

    function showImage(index) {
        galleryItems.forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });
    }

    function updateModalImage() {
        const newImageSrc = galleryItems[currentIndex].querySelector('img').src;
        modalImg.src = newImageSrc;
    }

    function nextImage() {
        currentIndex = (currentIndex + 1) % galleryItems.length;
        showImage(currentIndex);
    }

    function prevImage() {
        currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
        showImage(currentIndex);
    }

    function startAutoSwap() {
        // Ensure we don't have multiple intervals running
        clearInterval(autoSwapInterval);
        autoSwapInterval = setInterval(nextImage, 10000); // 10 seconds
    }

    if (galleryItems.length > 0) {
        showImage(currentIndex);
        startAutoSwap();

        galleryContainer.addEventListener('click', () => {
            clearInterval(autoSwapInterval); // Pause auto-swapping
            const currentImage = galleryItems[currentIndex].querySelector('img');
            modal.style.display = "block";
            modalImg.src = currentImage.src;
        });

        const closeModal = () => {
            modal.style.display = "none";
            startAutoSwap(); // Resume auto-swapping
        };

        modalClose.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => e.target === modal && closeModal());

        prevButton.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
            updateModalImage();
        });

        nextButton.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % galleryItems.length;
            updateModalImage();
        });
    }
});