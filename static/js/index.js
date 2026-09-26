// No jQuery: the page must keep working when third-party CDNs are unreachable.
document.addEventListener('DOMContentLoaded', function() {
	var demoVideos = Array.prototype.slice.call(document.querySelectorAll('video.demo-video'));

	var ZOOM = 3;
	var LENS_SIZE = 220;

	// Magnifier: a canvas centred on the cursor that redraws the video region under it at
	// ZOOM x on every animation frame, so it stays in sync with playback.
	function attachMagnifier(frame, video) {
		if (!window.matchMedia || !window.matchMedia('(hover: hover)').matches) return;

		var lens = document.createElement('canvas');
		lens.className = 'zoom-lens';
		var dpr = window.devicePixelRatio || 1;
		lens.width = LENS_SIZE * dpr;
		lens.height = LENS_SIZE * dpr;
		frame.appendChild(lens);
		var ctx = lens.getContext('2d');

		var cursor = null;
		var rafId = null;

		function draw() {
			rafId = null;
			if (!cursor || !video.videoWidth) return;
			var rect = frame.getBoundingClientRect();
			var scaleX = video.videoWidth / rect.width;
			var scaleY = video.videoHeight / rect.height;
			var srcW = (LENS_SIZE / ZOOM) * scaleX;
			var srcH = (LENS_SIZE / ZOOM) * scaleY;
			ctx.fillStyle = '#000';
			ctx.fillRect(0, 0, lens.width, lens.height);
			ctx.drawImage(video,
				cursor.x * scaleX - srcW / 2, cursor.y * scaleY - srcH / 2, srcW, srcH,
				0, 0, lens.width, lens.height);
			lens.style.left = cursor.x + 'px';
			lens.style.top = cursor.y + 'px';
			rafId = requestAnimationFrame(draw);
		}

		frame.addEventListener('mousemove', function(e) {
			var rect = frame.getBoundingClientRect();
			cursor = { x: e.clientX - rect.left, y: e.clientY - rect.top };
			frame.classList.add('is-zooming');
			if (rafId === null) rafId = requestAnimationFrame(draw);
		});
		frame.addEventListener('mouseleave', function() {
			cursor = null;
			frame.classList.remove('is-zooming');
			if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
		});
	}

	demoVideos.forEach(function(video) {
		// The markup ships with native controls so the videos are usable even if this script
		// never runs; once it does, the frame itself becomes the play/pause control.
		video.removeAttribute('controls');

		if (video.dataset.speed) {
			var badge = document.createElement('span');
			badge.className = 'speed-badge';
			badge.textContent = video.dataset.speed;
			video.insertAdjacentElement('afterend', badge);
		}

		var frame = video.closest('.video-frame');
		var sync = function() { frame.classList.toggle('is-paused', video.paused); };
		video.addEventListener('play', sync);
		video.addEventListener('pause', sync);
		sync();

		frame.addEventListener('click', function() {
			if (video.paused) {
				delete video.dataset.userPaused;
				video.play().catch(function() {});
			} else {
				video.dataset.userPaused = '1';
				video.pause();
			}
		});

		attachMagnifier(frame, video);
	});

	if (window.bulmaCarousel) {
		bulmaCarousel.attach('.demo-carousel', {
			// Two experiments visible at once, arrows advance by one.
			slidesToShow: 2,
			slidesToScroll: 1,
			// loop wraps around without infinite's cloned slides, so each video exists once.
			loop: true,
			infinite: false,
			autoplay: false,
			navigationKeys: false,
			breakpoints: [{ changePoint: 768, slidesToShow: 1, slidesToScroll: 1 }],
		});
	}
	if (window.bulmaSlider) {
		bulmaSlider.attach();
	}

	// Only the visible slide plays; slides scrolled out of the carousel or off screen pause.
	// Videos the user paused explicitly stay paused.
	if ('IntersectionObserver' in window) {
		var observer = new IntersectionObserver(function(entries) {
			entries.forEach(function(entry) {
				var video = entry.target;
				if (entry.isIntersecting && !video.dataset.userPaused) {
					video.play().catch(function() {});
				} else if (!entry.isIntersecting) {
					video.pause();
				}
			});
		}, { threshold: 0.25 });
		demoVideos.forEach(function(video) { observer.observe(video); });
	}
});
